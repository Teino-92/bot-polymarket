-- Table: market_scan
-- Résultats des scans de marchés avec scores HVS/FlipEV

CREATE TABLE IF NOT EXISTS market_scan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id TEXT NOT NULL,
  market_name TEXT NOT NULL,
  current_spread DECIMAL(10, 4) NOT NULL CHECK (current_spread >= 0),
  liquidity_usd DECIMAL(15, 2) NOT NULL CHECK (liquidity_usd >= 0),
  days_until_resolution INTEGER NOT NULL CHECK (days_until_resolution >= 0),
  hvs_score DECIMAL(10, 2) NOT NULL,
  flip_ev DECIMAL(10, 2) NOT NULL,
  recommendation TEXT NOT NULL CHECK (recommendation IN ('HOLD', 'FLIP', 'SKIP')),
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index pour requêtes rapides
CREATE INDEX idx_market_scan_market_id ON market_scan(market_id);
CREATE INDEX idx_market_scan_scanned_at ON market_scan(scanned_at DESC);
CREATE INDEX idx_market_scan_recommendation ON market_scan(recommendation);
CREATE INDEX idx_market_scan_flip_ev ON market_scan(flip_ev DESC);

-- Index composé pour trouver les meilleures opportunités
CREATE INDEX idx_market_scan_opportunities ON market_scan(recommendation, flip_ev DESC, scanned_at DESC);

-- Fonction pour nettoyer les vieux scans (garder seulement dernières 24h)
CREATE OR REPLACE FUNCTION cleanup_old_market_scans()
RETURNS void AS $$
BEGIN
  DELETE FROM market_scan
  WHERE scanned_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Commentaires
COMMENT ON TABLE market_scan IS 'Résultats des scans de marchés avec analyse HVS/FlipEV';
COMMENT ON COLUMN market_scan.recommendation IS 'Action recommandée: HOLD, FLIP ou SKIP';
COMMENT ON COLUMN market_scan.hvs_score IS 'Hold Value Score en EUR';
COMMENT ON COLUMN market_scan.flip_ev IS 'Expected Value flip strategy en EUR';
