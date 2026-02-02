import type { MarketFilters, RiskParams } from './types';

export const BOT_CONFIG = {
  // Capital & positions
  totalCapitalEur: 10,    // Ajusté à ton capital réel
  maxPositions: 2,
  maxPositionSizeEur: 5,  // 5€ max par position (50% du capital)
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
    minLiquidityUsd: 1000,   // Réduit de 10k à 1k pour Gamma API réelle
    minSpread: 0.01,         // Réduit de 3% à 1% pour marchés réels
    maxSpread: 0.20,         // Augmenté de 15% à 20%
    minDaysUntilResolution: 2,
    maxDaysUntilResolution: 365, // Augmenté de 90 à 365 jours
    excludeCategories: ['crypto', 'sports'],
    preferCategories: [] // Désactivé pour tester tous les marchés réels
  } as MarketFilters,

  // FlipEV calculation
  fillProbabilityBase: 0.70,
  flipsPerWeek: 2,

  // Execution
  cronIntervalHours: 4,    // Run bot every 4 hours
  simulationMode: false,    // Mode PRODUCTION - vraies transactions Polymarket
} as const;

export const RISK_PARAMS: RiskParams = {
  maxPositions: BOT_CONFIG.maxPositions,
  maxPositionSizeEur: BOT_CONFIG.maxPositionSizeEur,
  maxTotalExposure: BOT_CONFIG.maxTotalExposure,
  stopLossPercent: BOT_CONFIG.stopLossPercent,
  takeProfitPercent: BOT_CONFIG.takeProfitPercent,
  cooldownMinutes: BOT_CONFIG.cooldownMinutes,
};
