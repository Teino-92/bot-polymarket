-- Table: trades
-- Historique de tous les trades (ouverts et fermés)

CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id TEXT NOT NULL,
  market_name TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('YES', 'NO')),
  strategy TEXT NOT NULL CHECK (strategy IN ('HOLD', 'FLIP')),
  entry_price DECIMAL(10, 4) NOT NULL CHECK (entry_price >= 0 AND entry_price <= 1),
  exit_price DECIMAL(10, 4) CHECK (exit_price >= 0 AND exit_price <= 1),
  position_size_eur DECIMAL(10, 2) NOT NULL CHECK (position_size_eur > 0),
  pnl_eur DECIMAL(10, 2),
  hvs_score DECIMAL(10, 2) NOT NULL,
  flip_ev DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'STOPPED')),
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  tx_hash TEXT NOT NULL,

  -- Indexes
  CONSTRAINT trades_market_id_idx CHECK (market_id <> '')
);

-- Index pour requêtes rapides
CREATE INDEX idx_trades_market_id ON trades(market_id);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_opened_at ON trades(opened_at DESC);
CREATE INDEX idx_trades_strategy ON trades(strategy);

-- Index composé pour analytics
CREATE INDEX idx_trades_status_opened ON trades(status, opened_at DESC);

-- Commentaires
COMMENT ON TABLE trades IS 'Historique complet de tous les trades effectués par le bot';
COMMENT ON COLUMN trades.hvs_score IS 'Hold Value Score calculé au moment du trade';
COMMENT ON COLUMN trades.flip_ev IS 'Expected Value flip strategy calculé au moment du trade';
COMMENT ON COLUMN trades.pnl_eur IS 'Profit & Loss en EUR (NULL si position ouverte)';
