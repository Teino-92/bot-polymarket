import type { FlipEVInputs } from '../types';

/**
 * Flip Expected Value (FlipEV) Calculator
 *
 * Calcule le profit attendu en faisant du market making (acheter/vendre rapidement).
 *
 * Formule:
 * FlipEV = (Profit per Flip) × (Total Flips)
 *
 * Où:
 * - Profit per Flip = Spread × Position Size × Fill Probability
 * - Total Flips = Flips per Week × Weeks Available
 *
 * Exemple concret:
 * Spread: 4%, Size: 75€, Fill Prob: 0.70, Flips/Week: 2, Days: 65
 * → FlipEV = 37.80€ (Très rentable de flip!)
 */
export function calculateFlipEV(inputs: FlipEVInputs): number {
  const {
    spread,
    positionSizeEur,
    fillProbability,
    flipsPerWeek,
    daysUntilResolution,
  } = inputs;

  // Profit par flip réussi
  const profitPerFlip = spread * positionSizeEur * fillProbability;

  // Nombre total de flips possibles
  const weeksAvailable = daysUntilResolution / 7;
  const totalFlips = flipsPerWeek * weeksAvailable;

  // EV total
  const flipEV = profitPerFlip * totalFlips;

  return Number(flipEV.toFixed(2));
}

/**
 * Estime la probabilité de fill basée sur le spread
 *
 * Logique:
 * - Spread large (>5%) → Plus facile de se faire remplir → Fill prob élevée
 * - Spread serré (<3%) → Plus difficile → Fill prob basse
 */
export function estimateFillProbability(spread: number): number {
  if (spread >= 0.05) return 0.8; // Spread >= 5%
  if (spread >= 0.04) return 0.7; // Spread >= 4%
  if (spread >= 0.03) return 0.6; // Spread >= 3%
  return 0.5; // Spread < 3%
}

/**
 * Ajuste le nombre de flips/semaine basé sur la liquidité
 *
 * Logique:
 * - Haute liquidité (>50k) → 3 flips/semaine possibles
 * - Moyenne liquidité (>20k) → 2 flips/semaine
 * - Basse liquidité → 1 flip/semaine
 */
export function estimateFlipsPerWeek(liquidityUsd: number): number {
  if (liquidityUsd >= 50000) return 3;
  if (liquidityUsd >= 20000) return 2;
  return 1;
}

/**
 * Calcule le FlipEV avec estimation automatique des paramètres
 */
export function calculateFlipEVAuto(params: {
  spread: number;
  positionSizeEur: number;
  daysUntilResolution: number;
  liquidityUsd: number;
}): {
  flipEV: number;
  fillProbability: number;
  flipsPerWeek: number;
} {
  const fillProbability = estimateFillProbability(params.spread);
  const flipsPerWeek = estimateFlipsPerWeek(params.liquidityUsd);

  const flipEV = calculateFlipEV({
    spread: params.spread,
    positionSizeEur: params.positionSizeEur,
    fillProbability,
    flipsPerWeek,
    daysUntilResolution: params.daysUntilResolution,
  });

  return {
    flipEV,
    fillProbability,
    flipsPerWeek,
  };
}

/**
 * Détermine si un FlipEV justifie une stratégie FLIP
 */
export function isFlipEVProfitable(flipEV: number, minFlipEV: number = 3): boolean {
  return flipEV >= minFlipEV;
}

/**
 * Calcule le spread minimum requis pour un FlipEV target
 */
export function calculateRequiredSpread(params: {
  targetFlipEV: number;
  positionSizeEur: number;
  daysUntilResolution: number;
  fillProbability: number;
  flipsPerWeek: number;
}): number {
  const {
    targetFlipEV,
    positionSizeEur,
    daysUntilResolution,
    fillProbability,
    flipsPerWeek,
  } = params;

  const weeksAvailable = daysUntilResolution / 7;
  const totalFlips = flipsPerWeek * weeksAvailable;

  const requiredSpread =
    targetFlipEV / (positionSizeEur * fillProbability * totalFlips);

  return Number(requiredSpread.toFixed(4));
}

// Examples & Tests (pour vérification)
if (require.main === module) {
  console.log('🧮 Testing FlipEV Calculator\n');

  // Exemple 1 : Marché profitable pour FLIP
  const example1 = calculateFlipEV({
    spread: 0.04,
    positionSizeEur: 75,
    fillProbability: 0.7,
    flipsPerWeek: 2,
    daysUntilResolution: 65,
  });
  console.log('Example 1 (Should be profitable):');
  console.log(`  Spread: 4%, Size: 75€, Fill Prob: 0.70, Flips/Week: 2, Days: 65`);
  console.log(`  → FlipEV: ${example1}€`);
  console.log(`  → Recommendation: ${example1 >= 3 ? 'FLIP ✅' : 'SKIP ❌'}\n`);

  // Exemple 2 : Spread trop serré
  const example2 = calculateFlipEV({
    spread: 0.01,
    positionSizeEur: 75,
    fillProbability: 0.5,
    flipsPerWeek: 2,
    daysUntilResolution: 30,
  });
  console.log('Example 2 (Tight spread):');
  console.log(`  Spread: 1%, Size: 75€, Fill Prob: 0.50, Flips/Week: 2, Days: 30`);
  console.log(`  → FlipEV: ${example2}€`);
  console.log(`  → Recommendation: ${example2 >= 3 ? 'FLIP ✅' : 'SKIP ❌'}\n`);

  // Exemple 3 : Calcul automatique
  const example3 = calculateFlipEVAuto({
    spread: 0.052,
    positionSizeEur: 75,
    daysUntilResolution: 120,
    liquidityUsd: 45000,
  });
  console.log('Example 3 (Auto calculation):');
  console.log(`  Spread: 5.2%, Size: 75€, Days: 120, Liquidity: $45k`);
  console.log(`  → Fill Probability: ${example3.fillProbability}`);
  console.log(`  → Flips per Week: ${example3.flipsPerWeek}`);
  console.log(`  → FlipEV: ${example3.flipEV}€`);
  console.log(`  → Recommendation: ${example3.flipEV >= 3 ? 'FLIP ✅' : 'SKIP ❌'}\n`);

  // Exemple 4 : Spread requis pour target
  const requiredSpread = calculateRequiredSpread({
    targetFlipEV: 10,
    positionSizeEur: 75,
    daysUntilResolution: 60,
    fillProbability: 0.7,
    flipsPerWeek: 2,
  });
  console.log('Example 4 (Required spread for 10€ target):');
  console.log(`  Target: 10€, Size: 75€, Days: 60, Fill Prob: 0.70, Flips/Week: 2`);
  console.log(`  → Required Spread: ${(requiredSpread * 100).toFixed(2)}%\n`);
}
