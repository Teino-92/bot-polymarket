import type { MarketAnalysis, StrategyDecision } from '../types';
import { BOT_CONFIG } from '../config';
import { calculateHVS } from '../calculators/hvs-calculator';
import { calculateFlipEV } from '../calculators/flip-ev-calculator';
import { estimateFillProbability, estimateFlipsPerWeek } from '../calculators/flip-ev-calculator';

/**
 * Décide de la meilleure stratégie pour un marché: HOLD, FLIP ou SKIP
 *
 * Règles de décision:
 * 1. HOLD: HVS excellent ET meilleur que flip (avec marge 30%)
 * 2. FLIP: FlipEV profitable ET spread suffisant (>3%)
 * 3. SKIP: Ni l'un ni l'autre rentable
 */
export function decideStrategy(market: MarketAnalysis): StrategyDecision {
  const config = BOT_CONFIG;

  // Calcul HVS
  const hvs = calculateHVS({
    entryPrice: market.entryPrice,
    positionSizeEur: config.maxPositionSizeEur,
    winProbability: market.estimatedWinProbability,
    daysUntilResolution: market.daysUntilResolution,
    dailyOpportunityCost: config.dailyOpportunityCost,
  });

  // Calcul FlipEV
  const fillProbability = estimateFillProbability(market.spread);
  const flipsPerWeek = estimateFlipsPerWeek(market.liquidityUsd);

  const flipEV = calculateFlipEV({
    spread: market.spread,
    positionSizeEur: config.maxPositionSizeEur,
    fillProbability,
    flipsPerWeek,
    daysUntilResolution: market.daysUntilResolution,
  });

  // RÈGLE 1: HOLD si HVS excellent ET significativement meilleur que flip
  if (hvs >= config.minHVSForHold && hvs > flipEV * 1.3) {
    const winProbPercent = (market.estimatedWinProbability * 100).toFixed(0);
    return {
      action: 'HOLD',
      hvs,
      flipEV,
      reasoning: `Strong conviction (${winProbPercent}%) + HVS (${hvs}€) >> FlipEV (${flipEV}€)`,
      confidence: hvs > 15 ? 'HIGH' : 'MEDIUM',
    };
  }

  // RÈGLE 2: FLIP si profitable ET spread suffisant ET fenêtre temporelle OK
  if (
    flipEV >= config.minFlipEV &&
    market.spread >= config.marketFilters.minSpread &&
    market.daysUntilResolution >= 3
  ) {
    const spreadPercent = (market.spread * 100).toFixed(1);
    return {
      action: 'FLIP',
      hvs,
      flipEV,
      reasoning: `Good spread (${spreadPercent}%) + ${market.daysUntilResolution}d window = ${flipEV}€ EV`,
      confidence: market.spread > 0.05 ? 'HIGH' : 'MEDIUM',
    };
  }

  // RÈGLE 3: SKIP si rien de rentable
  return {
    action: 'SKIP',
    hvs,
    flipEV,
    reasoning: `HVS (${hvs}€) < ${config.minHVSForHold}€ AND FlipEV (${flipEV}€) < ${config.minFlipEV}€`,
    confidence: 'LOW',
  };
}

/**
 * Évalue un marché et retourne une analyse complète avec recommandation
 */
export function analyzeMarket(params: {
  marketId: string;
  marketName: string;
  bestBid: number;
  bestAsk: number;
  daysUntilResolution: number;
  liquidityUsd: number;
}): StrategyDecision & { spread: number } {
  const { marketId, marketName, bestBid, bestAsk, daysUntilResolution, liquidityUsd } = params;

  const spread = bestAsk - bestBid;
  const entryPrice = bestBid; // On entre au bid price

  // Estimer la probabilité de victoire basée sur le prix actuel
  // Si le marché est à 0.65, le consensus est 65% de chance
  const estimatedWinProbability = entryPrice;

  const market: MarketAnalysis = {
    marketId,
    marketName,
    entryPrice,
    spread,
    daysUntilResolution,
    estimatedWinProbability,
    liquidityUsd,
  };

  const decision = decideStrategy(market);

  return {
    ...decision,
    spread,
  };
}

/**
 * Compare deux opportunités et retourne la meilleure
 * Priorité: FlipEV (pour farming airdrop)
 */
export function comparOpportunities(
  a: StrategyDecision,
  b: StrategyDecision
): number {
  // SKIP vient toujours en dernier
  if (a.action === 'SKIP' && b.action !== 'SKIP') return 1;
  if (b.action === 'SKIP' && a.action !== 'SKIP') return -1;

  // Entre deux opportunités viables, prioriser FlipEV (meilleur pour airdrop)
  return b.flipEV - a.flipEV;
}

/**
 * Filtre les opportunités pour ne garder que les viables (HOLD ou FLIP)
 */
export function filterViableOpportunities(
  decisions: StrategyDecision[]
): StrategyDecision[] {
  return decisions
    .filter((d) => d.action !== 'SKIP')
    .sort(comparOpportunities);
}
