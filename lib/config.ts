import type { MarketFilters, RiskParams } from './types';

export const BOT_CONFIG = {
  // Capital & positions
  totalCapitalEur: 150,
  maxPositions: 2,
  maxPositionSizeEur: 75,
  maxTotalExposure: 0.90, // 90% max

  // HVS & FlipEV thresholds
  minHVSForHold: 5,        // € minimum pour stratégie HOLD
  minFlipEV: 3,            // € minimum pour stratégie FLIP
  dailyOpportunityCost: 0.003, // 0.3%/jour

  // Risk management
  stopLossPercent: 0.15,   // 15% loss → exit
  takeProfitPercent: 0.08, // 8% gain → exit (FLIP only)
  cooldownMinutes: 120,    // 2h entre trades même marché

  // Market filters
  marketFilters: {
    minLiquidityUsd: 10000,
    minSpread: 0.03,
    maxSpread: 0.15,
    minDaysUntilResolution: 2,
    maxDaysUntilResolution: 90,
    excludeCategories: ['crypto', 'sports'],
    preferCategories: ['politics', 'entertainment', 'tech', 'business']
  } as MarketFilters,

  // FlipEV calculation
  fillProbabilityBase: 0.70,
  flipsPerWeek: 2,

  // Execution
  cronIntervalHours: 4,    // Run bot every 4 hours
  simulationMode: true,     // TOUJOURS démarrer en simulation !
} as const;

export const RISK_PARAMS: RiskParams = {
  maxPositions: BOT_CONFIG.maxPositions,
  maxPositionSizeEur: BOT_CONFIG.maxPositionSizeEur,
  maxTotalExposure: BOT_CONFIG.maxTotalExposure,
  stopLossPercent: BOT_CONFIG.stopLossPercent,
  takeProfitPercent: BOT_CONFIG.takeProfitPercent,
  cooldownMinutes: BOT_CONFIG.cooldownMinutes,
};
