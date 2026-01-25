import type { MarketData, MarketFilters, Opportunity } from '../types';
import { polymarketClient } from './client';
import { analyzeMarket } from './strategy';
import { BOT_CONFIG } from '../config';

/**
 * Scanne les marchés Polymarket et retourne les meilleures opportunités
 * triées par FlipEV (pour maximiser farming airdrop)
 */
export async function scanTopMarkets(
  filters: MarketFilters = BOT_CONFIG.marketFilters
): Promise<Opportunity[]> {
  console.log('🔍 [MARKET SCANNER] Starting market scan...');

  // 1. Fetch marchés depuis Polymarket
  const markets = await polymarketClient.getMarkets({ limit: 100 });
  console.log(`   Found ${markets.length} markets from Polymarket`);

  // 2. Appliquer les filtres
  const filtered = filterMarkets(markets, filters);
  console.log(`   ${filtered.length} markets passed filters`);

  // 3. Analyser chaque marché (calcul HVS + FlipEV)
  const analyzed = filtered.map((market) => {
    const spread = market.bestAsk - market.bestBid;
    const daysUntil = calculateDaysUntilResolution(market.endDate);

    const analysis = analyzeMarket({
      marketId: market.id,
      marketName: market.question,
      bestBid: market.bestBid,
      bestAsk: market.bestAsk,
      daysUntilResolution: daysUntil,
      liquidityUsd: market.liquidity,
    });

    const opportunity: Opportunity = {
      marketId: market.id,
      marketName: market.question,
      entryPrice: market.bestBid,
      spread,
      daysUntilResolution: daysUntil,
      estimatedWinProbability: market.bestBid,
      liquidityUsd: market.liquidity,
      hvs: analysis.hvs,
      flipEV: analysis.flipEV,
      action: analysis.action,
      reasoning: analysis.reasoning,
      confidence: analysis.confidence,
    };

    return opportunity;
  });

  // 4. Trier par FlipEV (meilleur pour farming airdrop)
  const sorted = analyzed.sort((a, b) => {
    // SKIP en dernier
    if (a.action === 'SKIP' && b.action !== 'SKIP') return 1;
    if (b.action === 'SKIP' && a.action !== 'SKIP') return -1;

    // Sinon trier par FlipEV
    return b.flipEV - a.flipEV;
  });

  console.log(`   Top opportunity: ${sorted[0]?.marketName || 'None'}`);
  console.log(
    `   Action: ${sorted[0]?.action} | FlipEV: ${sorted[0]?.flipEV}€ | HVS: ${sorted[0]?.hvs}€`
  );

  return sorted;
}

/**
 * Filtre les marchés selon les critères définis
 */
export function filterMarkets(
  markets: MarketData[],
  filters: MarketFilters
): MarketData[] {
  let liquidityFail = 0;
  let spreadFail = 0;
  let timeFail = 0;
  let categoryFail = 0;
  let priceFail = 0;

  const filtered = markets.filter((market) => {
    const spread = market.bestAsk - market.bestBid;
    const daysUntil = calculateDaysUntilResolution(market.endDate);

    // Vérifier liquidité
    if (market.liquidity < filters.minLiquidityUsd) {
      liquidityFail++;
      return false;
    }

    // Vérifier spread
    if (spread < filters.minSpread || spread > filters.maxSpread) {
      spreadFail++;
      return false;
    }

    // Vérifier fenêtre temporelle
    if (
      daysUntil < filters.minDaysUntilResolution ||
      daysUntil > filters.maxDaysUntilResolution
    ) {
      timeFail++;
      return false;
    }

    // Vérifier catégories exclues
    if (filters.excludeCategories.includes(market.category.toLowerCase())) {
      categoryFail++;
      return false;
    }

    // Vérifier catégories préférées (optionnel)
    if (
      filters.preferCategories.length > 0 &&
      !filters.preferCategories.includes(market.category.toLowerCase())
    ) {
      categoryFail++;
      return false;
    }

    // Vérifier que les prix sont valides
    if (
      market.bestBid <= 0 ||
      market.bestAsk <= 0 ||
      market.bestBid >= 1 ||
      market.bestAsk >= 1 ||
      market.bestBid >= market.bestAsk
    ) {
      priceFail++;
      return false;
    }

    return true;
  });

  console.log(`   Filter failures: liquidity=${liquidityFail}, spread=${spreadFail}, time=${timeFail}, category=${categoryFail}, price=${priceFail}`);

  return filtered;
}

/**
 * Calcule le nombre de jours jusqu'à la résolution
 */
function calculateDaysUntilResolution(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Filtre pour ne garder que les opportunités viables (pas SKIP)
 */
export function getViableOpportunities(opportunities: Opportunity[]): Opportunity[] {
  return opportunities.filter((opp) => opp.action !== 'SKIP');
}

/**
 * Récupère la meilleure opportunité disponible
 */
export function getBestOpportunity(opportunities: Opportunity[]): Opportunity | null {
  const viable = getViableOpportunities(opportunities);
  return viable.length > 0 ? viable[0] : null;
}
