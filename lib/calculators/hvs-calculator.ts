import type { HVSInputs } from '../types';

/**
 * Hold Value Score (HVS) Calculator
 *
 * Détermine si tenir une position jusqu'à résolution est profitable.
 *
 * Formule:
 * HVS = (Expected Profit × Win Probability)
 *     - (Max Loss × Loss Probability)
 *     - (Opportunity Cost)
 *     - (Long Term Penalty)
 *
 * Exemple concret:
 * Entry: 0.43 YES, Size: 75€, Win prob: 0.55, Days: 65
 * → HVS = -4.50€ (PAS rentable de hold)
 */
export function calculateHVS(inputs: HVSInputs): number {
  const {
    entryPrice,
    positionSizeEur,
    winProbability,
    daysUntilResolution,
    dailyOpportunityCost,
  } = inputs;

  // Scénario win : le marché résout en ta faveur (payout = 1.00)
  const expectedProfit = (1.0 - entryPrice) * positionSizeEur;

  // Scénario loss : le marché résout contre toi (payout = 0)
  const maxLoss = entryPrice * positionSizeEur;
  const lossProbability = 1 - winProbability;

  // Opportunité cost : capital bloqué pendant X jours
  const opportunityCost = positionSizeEur * dailyOpportunityCost * daysUntilResolution;

  // Penalty si marché trop long (>30 jours)
  const longTermPenalty = daysUntilResolution > 30 ? (daysUntilResolution - 30) * 0.5 : 0;

  const hvs =
    expectedProfit * winProbability -
    maxLoss * lossProbability -
    opportunityCost -
    longTermPenalty;

  return Number(hvs.toFixed(2));
}

/**
 * Estime la probabilité de victoire basée sur le prix du marché
 *
 * En mode simple, on utilise le prix du marché comme proxy
 * (YES @ 0.65 = marché pense 65% de chance)
 *
 * Dans une version avancée, on pourrait ajuster avec:
 * - Analyse de sentiment
 * - Données historiques
 * - Machine learning
 */
export function estimateWinProbability(
  entryPrice: number,
  side: 'YES' | 'NO'
): number {
  // Le prix du marché reflète la probabilité consensuelle
  if (side === 'YES') {
    return entryPrice;
  } else {
    return 1 - entryPrice;
  }
}

/**
 * Calcule le HVS pour différentes probabilités de victoire
 * Utile pour faire une analyse de sensibilité
 */
export function calculateHVSSensitivity(
  baseInputs: Omit<HVSInputs, 'winProbability'>
): Array<{ winProbability: number; hvs: number }> {
  const probabilities = [0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7];

  return probabilities.map((winProbability) => ({
    winProbability,
    hvs: calculateHVS({ ...baseInputs, winProbability }),
  }));
}

/**
 * Détermine si un HVS justifie une stratégie HOLD
 */
export function isHVSProfitable(hvs: number, minHVS: number = 5): boolean {
  return hvs >= minHVS;
}

// Examples & Tests (pour vérification)
if (require.main === module) {
  console.log('🧮 Testing HVS Calculator\n');

  // Exemple 1 : Marché non profitable pour HOLD
  const example1 = calculateHVS({
    entryPrice: 0.43,
    positionSizeEur: 75,
    winProbability: 0.55,
    daysUntilResolution: 65,
    dailyOpportunityCost: 0.003,
  });
  console.log('Example 1 (Should be unprofitable):');
  console.log(`  Entry: 0.43, Size: 75€, Win Prob: 0.55, Days: 65`);
  console.log(`  → HVS: ${example1}€`);
  console.log(`  → Recommendation: ${example1 >= 5 ? 'HOLD ✅' : 'SKIP/FLIP ❌'}\n`);

  // Exemple 2 : Marché profitable pour HOLD
  const example2 = calculateHVS({
    entryPrice: 0.25,
    positionSizeEur: 75,
    winProbability: 0.70,
    daysUntilResolution: 20,
    dailyOpportunityCost: 0.003,
  });
  console.log('Example 2 (Should be profitable):');
  console.log(`  Entry: 0.25, Size: 75€, Win Prob: 0.70, Days: 20`);
  console.log(`  → HVS: ${example2}€`);
  console.log(`  → Recommendation: ${example2 >= 5 ? 'HOLD ✅' : 'SKIP/FLIP ❌'}\n`);

  // Exemple 3 : Analyse de sensibilité
  const sensitivity = calculateHVSSensitivity({
    entryPrice: 0.35,
    positionSizeEur: 75,
    daysUntilResolution: 30,
    dailyOpportunityCost: 0.003,
  });
  console.log('Example 3 (Sensitivity Analysis):');
  console.log(`  Entry: 0.35, Size: 75€, Days: 30\n`);
  sensitivity.forEach(({ winProbability, hvs }) => {
    console.log(`  Win Prob: ${(winProbability * 100).toFixed(0)}% → HVS: ${hvs}€`);
  });
}
