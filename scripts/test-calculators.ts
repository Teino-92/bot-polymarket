/**
 * Script de test des calculateurs HVS et FlipEV
 * Usage: npx ts-node scripts/test-calculators.ts
 */

import { calculateHVS, calculateHVSSensitivity, isHVSProfitable } from '../lib/calculators/hvs-calculator';
import { calculateFlipEV, calculateFlipEVAuto, isFlipEVProfitable } from '../lib/calculators/flip-ev-calculator';
import { decideStrategy } from '../lib/polymarket/strategy';
import type { MarketAnalysis } from '../lib/types';

console.log('🧮 Testing Polymarket Bot Calculators\n');
console.log('=' .repeat(60));

// Test 1: HVS Calculator
console.log('\n📊 TEST 1: Hold Value Score (HVS)\n');

const hvsTest1 = calculateHVS({
  entryPrice: 0.43,
  positionSizeEur: 75,
  winProbability: 0.55,
  daysUntilResolution: 65,
  dailyOpportunityCost: 0.003,
});

console.log('Scenario 1: Marché non profitable pour HOLD');
console.log('  Entry: 0.43 YES');
console.log('  Size: 75€');
console.log('  Win Probability: 55%');
console.log('  Days: 65');
console.log(`  → HVS: ${hvsTest1}€`);
console.log(`  → Profitable: ${isHVSProfitable(hvsTest1) ? 'YES ✅' : 'NO ❌'}\n`);

const hvsTest2 = calculateHVS({
  entryPrice: 0.25,
  positionSizeEur: 75,
  winProbability: 0.70,
  daysUntilResolution: 20,
  dailyOpportunityCost: 0.003,
});

console.log('Scenario 2: Marché profitable pour HOLD');
console.log('  Entry: 0.25 YES');
console.log('  Size: 75€');
console.log('  Win Probability: 70%');
console.log('  Days: 20');
console.log(`  → HVS: ${hvsTest2}€`);
console.log(`  → Profitable: ${isHVSProfitable(hvsTest2) ? 'YES ✅' : 'NO ❌'}\n`);

// Test 2: FlipEV Calculator
console.log('=' .repeat(60));
console.log('\n💱 TEST 2: Flip Expected Value (FlipEV)\n');

const flipTest1 = calculateFlipEV({
  spread: 0.04,
  positionSizeEur: 75,
  fillProbability: 0.7,
  flipsPerWeek: 2,
  daysUntilResolution: 65,
});

console.log('Scenario 1: Marché profitable pour FLIP');
console.log('  Spread: 4%');
console.log('  Size: 75€');
console.log('  Fill Probability: 0.70');
console.log('  Flips/Week: 2');
console.log('  Days: 65');
console.log(`  → FlipEV: ${flipTest1}€`);
console.log(`  → Profitable: ${isFlipEVProfitable(flipTest1) ? 'YES ✅' : 'NO ❌'}\n`);

const flipTest2 = calculateFlipEV({
  spread: 0.01,
  positionSizeEur: 75,
  fillProbability: 0.5,
  flipsPerWeek: 2,
  daysUntilResolution: 30,
});

console.log('Scenario 2: Spread trop serré');
console.log('  Spread: 1%');
console.log('  Size: 75€');
console.log('  Fill Probability: 0.50');
console.log('  Flips/Week: 2');
console.log('  Days: 30');
console.log(`  → FlipEV: ${flipTest2}€`);
console.log(`  → Profitable: ${isFlipEVProfitable(flipTest2) ? 'YES ✅' : 'NO ❌'}\n`);

// Test 3: Auto calculation
console.log('=' .repeat(60));
console.log('\n🤖 TEST 3: Auto Calculation (FlipEV)\n');

const autoTest = calculateFlipEVAuto({
  spread: 0.052,
  positionSizeEur: 75,
  daysUntilResolution: 120,
  liquidityUsd: 45000,
});

console.log('Scenario: High liquidity, good spread');
console.log('  Spread: 5.2%');
console.log('  Size: 75€');
console.log('  Days: 120');
console.log('  Liquidity: $45k');
console.log(`  → Auto Fill Probability: ${autoTest.fillProbability}`);
console.log(`  → Auto Flips/Week: ${autoTest.flipsPerWeek}`);
console.log(`  → FlipEV: ${autoTest.flipEV}€`);
console.log(`  → Profitable: ${isFlipEVProfitable(autoTest.flipEV) ? 'YES ✅' : 'NO ❌'}\n`);

// Test 4: Strategy Decision
console.log('=' .repeat(60));
console.log('\n🎯 TEST 4: Strategy Decision (HOLD vs FLIP vs SKIP)\n');

const market1: MarketAnalysis = {
  marketId: 'test-1',
  marketName: 'Will Apple announce AR glasses before June 2025?',
  entryPrice: 0.32,
  spread: 0.05,
  daysUntilResolution: 120,
  estimatedWinProbability: 0.35,
  liquidityUsd: 45000,
};

const decision1 = decideStrategy(market1);

console.log('Market 1: Apple AR glasses');
console.log('  Entry: 0.32, Spread: 5%, Days: 120');
console.log(`  HVS: ${decision1.hvs}€`);
console.log(`  FlipEV: ${decision1.flipEV}€`);
console.log(`  → Decision: ${decision1.action} (${decision1.confidence})`);
console.log(`  → Reasoning: ${decision1.reasoning}\n`);

const market2: MarketAnalysis = {
  marketId: 'test-2',
  marketName: 'Will Bitcoin reach $150k this week?',
  entryPrice: 0.08,
  spread: 0.01,
  daysUntilResolution: 4,
  estimatedWinProbability: 0.10,
  liquidityUsd: 250000,
};

const decision2 = decideStrategy(market2);

console.log('Market 2: Bitcoin $150k');
console.log('  Entry: 0.08, Spread: 1%, Days: 4');
console.log(`  HVS: ${decision2.hvs}€`);
console.log(`  FlipEV: ${decision2.flipEV}€`);
console.log(`  → Decision: ${decision2.action} (${decision2.confidence})`);
console.log(`  → Reasoning: ${decision2.reasoning}\n`);

const market3: MarketAnalysis = {
  marketId: 'test-3',
  marketName: 'Will France win Eurovision 2025?',
  entryPrice: 0.18,
  spread: 0.02,
  daysUntilResolution: 85,
  estimatedWinProbability: 0.30,
  liquidityUsd: 28000,
};

const decision3 = decideStrategy(market3);

console.log('Market 3: France Eurovision');
console.log('  Entry: 0.18, Spread: 2%, Days: 85');
console.log(`  HVS: ${decision3.hvs}€`);
console.log(`  FlipEV: ${decision3.flipEV}€`);
console.log(`  → Decision: ${decision3.action} (${decision3.confidence})`);
console.log(`  → Reasoning: ${decision3.reasoning}\n`);

// Test 5: Sensitivity Analysis
console.log('=' .repeat(60));
console.log('\n📈 TEST 5: HVS Sensitivity Analysis\n');

const sensitivity = calculateHVSSensitivity({
  entryPrice: 0.35,
  positionSizeEur: 75,
  daysUntilResolution: 30,
  dailyOpportunityCost: 0.003,
});

console.log('Market: Entry 0.35, Size 75€, Days 30');
console.log('Win Probability → HVS:');
sensitivity.forEach(({ winProbability, hvs }) => {
  const symbol = hvs >= 5 ? '✅' : '❌';
  console.log(`  ${(winProbability * 100).toFixed(0)}% → ${hvs.toFixed(2)}€ ${symbol}`);
});

console.log('\n' + '=' .repeat(60));
console.log('\n✅ All tests completed!\n');
