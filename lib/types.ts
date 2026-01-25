// Market & Trading Types
export interface MarketData {
  id: string;
  question: string;
  category: string;
  endDate: string;
  liquidity: number;
  bestBid: number;
  bestAsk: number;
  volume24h?: number;
}

export interface MarketAnalysis {
  marketId: string;
  marketName: string;
  entryPrice: number;
  spread: number;
  daysUntilResolution: number;
  estimatedWinProbability: number;
  liquidityUsd: number;
}

export type TradeSide = 'YES' | 'NO';
export type TradeStrategy = 'HOLD' | 'FLIP';
export type StrategyAction = 'HOLD' | 'FLIP' | 'SKIP';
export type StrategyConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type PositionStatus = 'OPEN' | 'CLOSED' | 'STOPPED';

export interface StrategyDecision {
  action: StrategyAction;
  hvs: number;
  flipEV: number;
  reasoning: string;
  confidence: StrategyConfidence;
}

// Database Models
export interface Trade {
  id: string;
  market_id: string;
  market_name: string;
  side: TradeSide;
  strategy: TradeStrategy;
  entry_price: number;
  exit_price: number | null;
  position_size_eur: number;
  pnl_eur: number | null;
  hvs_score: number;
  flip_ev: number;
  status: PositionStatus;
  opened_at: string;
  closed_at: string | null;
  tx_hash: string;
}

export interface Position {
  id: string;
  market_id: string;
  market_name: string;
  side: TradeSide;
  strategy: TradeStrategy;
  entry_price: number;
  current_price: number;
  position_size_eur: number;
  unrealized_pnl_eur: number;
  days_until_resolution: number;
  stop_loss_price: number;
  take_profit_price: number | null;
  opened_at: string;
  updated_at: string;
}

export interface MarketScan {
  id: string;
  market_id: string;
  market_name: string;
  current_spread: number;
  liquidity_usd: number;
  days_until_resolution: number;
  hvs_score: number;
  flip_ev: number;
  recommendation: StrategyAction;
  scanned_at: string;
}

export interface BotConfig {
  id: string;
  key: string;
  value: any;
  updated_at: string;
}

// Calculator Inputs
export interface HVSInputs {
  entryPrice: number;
  positionSizeEur: number;
  winProbability: number;
  daysUntilResolution: number;
  dailyOpportunityCost: number;
}

export interface FlipEVInputs {
  spread: number;
  positionSizeEur: number;
  fillProbability: number;
  flipsPerWeek: number;
  daysUntilResolution: number;
}

// Risk Management
export interface RiskParams {
  maxPositions: number;
  maxPositionSizeEur: number;
  maxTotalExposure: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  cooldownMinutes: number;
}

// Market Filters
export interface MarketFilters {
  minLiquidityUsd: number;
  minSpread: number;
  maxSpread: number;
  minDaysUntilResolution: number;
  maxDaysUntilResolution: number;
  excludeCategories: string[];
  preferCategories: string[];
}

// Order Types
export interface OrderParams {
  marketId: string;
  side: TradeSide;
  price: number;
  size: number;
}

export interface OrderResult {
  orderId: string;
  txHash: string;
  status: string;
}

// Dashboard Data
export interface DashboardOverview {
  totalPnL: number;
  pnlChange24h: number;
  volumeTraded: number;
  tradesCount: number;
  winRate: number;
  closedTrades: number;
  pnlHistory7d: PnLDataPoint[];
}

export interface PnLDataPoint {
  date: string;
  pnl: number;
}

export interface Opportunity extends MarketAnalysis {
  hvs: number;
  flipEV: number;
  action: StrategyAction;
  reasoning: string;
  confidence: StrategyConfidence;
}
