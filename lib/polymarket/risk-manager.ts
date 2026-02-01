import type { Position, RiskParams, TradeSide, TradeStrategy } from '../types';
import { supabaseAdmin } from '../supabase';
import { polymarketClient } from './client';
import { RISK_PARAMS, BOT_CONFIG } from '../config';
import { notifyPositionClosed } from '../telegram';

/**
 * Risk Manager
 * Gère le sizing, stop-loss, take-profit et monitoring des positions
 */
export class RiskManager {
  private params: RiskParams;
  private capital: number;

  constructor(params: RiskParams = RISK_PARAMS, capital: number = BOT_CONFIG.totalCapitalEur) {
    this.params = params;
    this.capital = capital;
  }

  /**
   * Vérifie si on peut ouvrir une nouvelle position
   */
  async canOpenPosition(marketId: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    // 1. Check nombre positions actives
    const { data: activePositions } = await supabaseAdmin
      .from('positions')
      .select('*');

    if (!activePositions) {
      return { allowed: false, reason: 'Failed to fetch active positions' };
    }

    if (activePositions.length >= this.params.maxPositions) {
      return {
        allowed: false,
        reason: `Max positions reached (${activePositions.length}/${this.params.maxPositions})`,
      };
    }

    // 2. Check exposition totale
    const totalExposure = activePositions.reduce(
      (sum, p) => sum + Number(p.position_size_eur),
      0
    );

    const maxExposure = this.capital * this.params.maxTotalExposure;

    if (totalExposure + this.params.maxPositionSizeEur > maxExposure) {
      return {
        allowed: false,
        reason: `Would exceed max exposure (${totalExposure.toFixed(2)}€ + ${this.params.maxPositionSizeEur}€ > ${maxExposure.toFixed(2)}€)`,
      };
    }

    // 3. Check cooldown
    const { data: lastTrade } = await supabaseAdmin
      .from('trades')
      .select('*')
      .eq('market_id', marketId)
      .order('closed_at', { ascending: false })
      .limit(1)
      .single();

    if (lastTrade && lastTrade.closed_at) {
      const cooldownMs = this.params.cooldownMinutes * 60 * 1000;
      const timeSinceClose = Date.now() - new Date(lastTrade.closed_at).getTime();

      if (timeSinceClose < cooldownMs) {
        const remainingMinutes = Math.ceil((cooldownMs - timeSinceClose) / 60000);
        return {
          allowed: false,
          reason: `Cooldown active (${remainingMinutes} minutes remaining)`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Calcule le prix de stop-loss pour une position
   */
  calculateStopLoss(entryPrice: number, side: TradeSide): number {
    if (side === 'YES') {
      // Si on a acheté YES @ 0.50, stop-loss @ 0.425 (15% down)
      return Number((entryPrice * (1 - this.params.stopLossPercent)).toFixed(4));
    } else {
      // Si on a acheté NO @ 0.50, stop-loss @ 0.575
      return Number((entryPrice * (1 + this.params.stopLossPercent)).toFixed(4));
    }
  }

  /**
   * Calcule le prix de take-profit pour une position (FLIP uniquement)
   */
  calculateTakeProfit(
    entryPrice: number,
    side: TradeSide,
    strategy: TradeStrategy
  ): number | null {
    // Seulement pour stratégie FLIP
    if (strategy === 'HOLD') return null;

    if (side === 'YES') {
      return Number((entryPrice * (1 + this.params.takeProfitPercent)).toFixed(4));
    } else {
      return Number((entryPrice * (1 - this.params.takeProfitPercent)).toFixed(4));
    }
  }

  /**
   * Calcule le PnL non réalisé pour une position
   */
  calculateUnrealizedPnL(
    entryPrice: number,
    currentPrice: number,
    positionSize: number,
    side: TradeSide
  ): number {
    if (side === 'YES') {
      // PnL = (Current - Entry) × Size
      return Number(((currentPrice - entryPrice) * positionSize).toFixed(2));
    } else {
      // Pour NO, inverse
      return Number(((entryPrice - currentPrice) * positionSize).toFixed(2));
    }
  }

  /**
   * Monitore toutes les positions actives et déclenche stop-loss/take-profit
   */
  async monitorPositions(): Promise<{
    checked: number;
    closed: number;
    updated: number;
  }> {
    console.log('🛡️  [RISK MANAGER] Monitoring active positions...');

    const { data: positions } = await supabaseAdmin
      .from('positions')
      .select('*');

    if (!positions || positions.length === 0) {
      console.log('   No active positions to monitor');
      return { checked: 0, closed: 0, updated: 0 };
    }

    let closedCount = 0;
    let updatedCount = 0;

    for (const position of positions) {
      const currentPrice = await polymarketClient.getPrice(position.market_id);

      // Check stop-loss
      const shouldStopLoss =
        (position.side === 'YES' && currentPrice <= position.stop_loss_price) ||
        (position.side === 'NO' && currentPrice >= position.stop_loss_price);

      if (shouldStopLoss) {
        console.log(`   🔴 Stop-loss triggered for ${position.market_name}`);
        await this.closePosition(position.id, currentPrice, 'STOPPED');
        closedCount++;
        continue;
      }

      // Check take-profit (seulement FLIP)
      if (position.strategy === 'FLIP' && position.take_profit_price) {
        const shouldTakeProfit =
          (position.side === 'YES' && currentPrice >= position.take_profit_price) ||
          (position.side === 'NO' && currentPrice <= position.take_profit_price);

        if (shouldTakeProfit) {
          console.log(`   🟢 Take-profit triggered for ${position.market_name}`);
          await this.closePosition(position.id, currentPrice, 'CLOSED');
          closedCount++;
          continue;
        }
      }

      // Update unrealized PnL
      const unrealizedPnL = this.calculateUnrealizedPnL(
        Number(position.entry_price),
        currentPrice,
        Number(position.position_size_eur),
        position.side
      );

      await supabaseAdmin
        .from('positions')
        .update({
          current_price: currentPrice,
          unrealized_pnl_eur: unrealizedPnL,
        })
        .eq('id', position.id);

      updatedCount++;
    }

    console.log(`   Checked: ${positions.length}, Closed: ${closedCount}, Updated: ${updatedCount}`);
    return {
      checked: positions.length,
      closed: closedCount,
      updated: updatedCount,
    };
  }

  /**
   * Ferme une position et enregistre le trade
   */
  private async closePosition(
    positionId: string,
    exitPrice: number,
    status: 'CLOSED' | 'STOPPED'
  ): Promise<void> {
    // Récupérer la position
    const { data: position } = await supabaseAdmin
      .from('positions')
      .select('*')
      .eq('id', positionId)
      .single();

    if (!position) {
      throw new Error(`Position ${positionId} not found`);
    }

    // Calculer PnL réalisé
    const pnl = this.calculateUnrealizedPnL(
      Number(position.entry_price),
      exitPrice,
      Number(position.position_size_eur),
      position.side
    );

    // Récupérer le trade correspondant
    const { data: trade } = await supabaseAdmin
      .from('trades')
      .select('*')
      .eq('market_id', position.market_id)
      .eq('status', 'OPEN')
      .single();

    if (trade) {
      // Mettre à jour le trade
      await supabaseAdmin
        .from('trades')
        .update({
          exit_price: exitPrice,
          pnl_eur: pnl,
          status,
          closed_at: new Date().toISOString(),
        })
        .eq('id', trade.id);
    }

    // Supprimer la position
    await supabaseAdmin
      .from('positions')
      .delete()
      .eq('id', positionId);

    console.log(
      `   Position closed: ${position.market_name} | PnL: ${pnl > 0 ? '+' : ''}${pnl.toFixed(2)}€`
    );

    // Envoyer notification Telegram
    await notifyPositionClosed({
      marketName: position.market_name,
      entryPrice: Number(position.entry_price),
      exitPrice,
      pnl,
      reason: status,
    });
  }

  /**
   * Récupère les positions actives
   */
  async getActivePositions(): Promise<Position[]> {
    const { data, error } = await supabaseAdmin
      .from('positions')
      .select('*')
      .order('opened_at', { ascending: false });

    if (error) {
      console.error('[RISK MANAGER] Error fetching positions:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Récupère l'exposition totale actuelle
   */
  async getTotalExposure(): Promise<number> {
    const positions = await this.getActivePositions();
    return positions.reduce((sum, p) => sum + Number(p.position_size_eur), 0);
  }
}

// Export singleton instance
export const riskManager = new RiskManager();
