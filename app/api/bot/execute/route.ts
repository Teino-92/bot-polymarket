import { NextResponse } from 'next/server';
import { riskManager } from '@/lib/polymarket/risk-manager';
import { scanTopMarkets, getBestOpportunity } from '@/lib/polymarket/market-selector';
import { polymarketClient } from '@/lib/polymarket/client';
import { supabaseAdmin } from '@/lib/supabase';
import { BOT_CONFIG } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Route principale d'exécution du bot
 * Appelée par cron toutes les 4 heures (ou manuellement)
 */
export async function POST() {
  try {
    console.log('🤖 [BOT EXECUTE] Starting bot execution...');
    console.log(`   Simulation mode: ${polymarketClient.isSimulation() ? 'YES' : 'NO'}`);

    // 1. Monitor positions existantes (stop-loss, take-profit)
    const monitorResult = await riskManager.monitorPositions();
    console.log(
      `   Monitored ${monitorResult.checked} positions, closed ${monitorResult.closed}`
    );

    // 2. Check si on peut ouvrir nouvelle position
    const activePositions = await riskManager.getActivePositions();
    const canOpen = activePositions.length < BOT_CONFIG.maxPositions;

    if (!canOpen) {
      console.log(`   Max positions reached (${activePositions.length}/${BOT_CONFIG.maxPositions})`);
      return NextResponse.json({
        status: 'idle',
        reason: 'Max positions reached',
        activePositions: activePositions.length,
        monitorResult,
      });
    }

    // 3. Scan top marchés Polymarket
    console.log('   Scanning markets...');
    const opportunities = await scanTopMarkets();

    // Sauvegarder les scans
    const scans = opportunities.slice(0, 20).map((opp) => ({
      market_id: opp.marketId,
      market_name: opp.marketName,
      current_spread: opp.spread,
      liquidity_usd: opp.liquidityUsd,
      days_until_resolution: opp.daysUntilResolution,
      hvs_score: opp.hvs,
      flip_ev: opp.flipEV,
      recommendation: opp.action,
    }));

    if (scans.length > 0) {
      await supabaseAdmin.from('market_scan').insert(scans);
    }

    // 4. Trouver la meilleure opportunité
    const best = getBestOpportunity(opportunities);

    if (!best) {
      console.log('   No viable opportunities found');
      return NextResponse.json({
        status: 'no_opportunities',
        scanned: opportunities.length,
        monitorResult,
      });
    }

    console.log(`   Best opportunity: ${best.marketName}`);
    console.log(`   Action: ${best.action} | FlipEV: ${best.flipEV}€ | HVS: ${best.hvs}€`);

    // 5. Vérifier risk management
    const riskCheck = await riskManager.canOpenPosition(best.marketId);

    if (!riskCheck.allowed) {
      console.log(`   Risk check failed: ${riskCheck.reason}`);
      return NextResponse.json({
        status: 'risk_blocked',
        reason: riskCheck.reason,
        market: best.marketName,
        monitorResult,
      });
    }

    // 6. Placer l'ordre
    console.log(`   Placing order...`);
    const order = await polymarketClient.placeLimitOrder({
      marketId: best.marketId,
      side: 'YES', // Toujours YES pour simplifier (peut être amélioré)
      price: best.entryPrice,
      size: BOT_CONFIG.maxPositionSizeEur,
    });

    console.log(`   Order placed: ${order.orderId}`);

    // 7. Calculer stop-loss et take-profit
    const stopLossPrice = riskManager.calculateStopLoss(best.entryPrice, 'YES');
    const takeProfitPrice = riskManager.calculateTakeProfit(
      best.entryPrice,
      'YES',
      best.action as 'HOLD' | 'FLIP'
    );

    // 8. Enregistrer position en DB
    const { data: position, error: positionError } = await supabaseAdmin
      .from('positions')
      .insert({
        market_id: best.marketId,
        market_name: best.marketName,
        side: 'YES',
        strategy: best.action,
        entry_price: best.entryPrice,
        current_price: best.entryPrice,
        position_size_eur: BOT_CONFIG.maxPositionSizeEur,
        unrealized_pnl_eur: 0,
        days_until_resolution: best.daysUntilResolution,
        stop_loss_price: stopLossPrice,
        take_profit_price: takeProfitPrice,
      })
      .select()
      .single();

    if (positionError) {
      console.error('Error creating position:', positionError);
      throw positionError;
    }

    // 9. Enregistrer trade en DB
    await supabaseAdmin.from('trades').insert({
      market_id: best.marketId,
      market_name: best.marketName,
      side: 'YES',
      strategy: best.action,
      entry_price: best.entryPrice,
      position_size_eur: BOT_CONFIG.maxPositionSizeEur,
      hvs_score: best.hvs,
      flip_ev: best.flipEV,
      status: 'OPEN',
      tx_hash: order.txHash,
    });

    console.log('   ✅ Position opened successfully');

    return NextResponse.json({
      status: 'position_opened',
      market: best.marketName,
      strategy: best.action,
      size: BOT_CONFIG.maxPositionSizeEur,
      hvs: best.hvs,
      flipEV: best.flipEV,
      txHash: order.txHash,
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      monitorResult,
    });
  } catch (error: any) {
    console.error('[BOT EXECUTE] Error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
