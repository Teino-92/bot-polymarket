-- Table: positions
-- Positions actives uniquement (max 2 simultanées)

CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id TEXT UNIQUE NOT NULL,
  market_name TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('YES', 'NO')),
  strategy TEXT NOT NULL CHECK (strategy IN ('HOLD', 'FLIP')),
  entry_price DECIMAL(10, 4) NOT NULL CHECK (entry_price >= 0 AND entry_price <= 1),
  current_price DECIMAL(10, 4) NOT NULL CHECK (current_price >= 0 AND current_price <= 1),
  position_size_eur DECIMAL(10, 2) NOT NULL CHECK (position_size_eur > 0),
  unrealized_pnl_eur DECIMAL(10, 2) NOT NULL DEFAULT 0,
  days_until_resolution INTEGER NOT NULL CHECK (days_until_resolution >= 0),
  stop_loss_price DECIMAL(10, 4) NOT NULL CHECK (stop_loss_price >= 0 AND stop_loss_price <= 1),
  take_profit_price DECIMAL(10, 4) CHECK (take_profit_price >= 0 AND take_profit_price <= 1),
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Contrainte: pas plus de 2 positions actives
  CONSTRAINT positions_limit CHECK (
    (SELECT COUNT(*) FROM positions) <= 2
  )
);

-- Index pour requêtes rapides
CREATE INDEX idx_positions_market_id ON positions(market_id);
CREATE INDEX idx_positions_updated_at ON positions(updated_at DESC);
CREATE INDEX idx_positions_strategy ON positions(strategy);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER positions_updated_at
BEFORE UPDATE ON positions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Commentaires
COMMENT ON TABLE positions IS 'Positions actuellement ouvertes (maximum 2)';
COMMENT ON COLUMN positions.unrealized_pnl_eur IS 'PnL non réalisé basé sur current_price';
COMMENT ON COLUMN positions.take_profit_price IS 'Prix cible pour stratégie FLIP (NULL pour HOLD)';
