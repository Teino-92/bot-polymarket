-- Table: bot_config
-- Configuration dynamique du bot (modifiable sans redéploiement)

CREATE TABLE IF NOT EXISTS bot_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_bot_config_key ON bot_config(key);

-- Trigger pour updated_at
CREATE TRIGGER bot_config_updated_at
BEFORE UPDATE ON bot_config
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Configuration par défaut
INSERT INTO bot_config (key, value) VALUES
  ('max_positions', '2'),
  ('max_position_size_eur', '75'),
  ('min_hvs_for_hold', '5'),
  ('min_flip_ev', '3'),
  ('stop_loss_percent', '0.15'),
  ('take_profit_percent', '0.08'),
  ('cooldown_minutes', '120'),
  ('simulation_mode', 'true')
ON CONFLICT (key) DO NOTHING;

-- Commentaires
COMMENT ON TABLE bot_config IS 'Configuration dynamique du bot (paramètres modifiables)';
COMMENT ON COLUMN bot_config.value IS 'Valeur JSON du paramètre';

-- Fonction helper pour récupérer une config
CREATE OR REPLACE FUNCTION get_bot_config(config_key TEXT)
RETURNS JSONB AS $$
DECLARE
  config_value JSONB;
BEGIN
  SELECT value INTO config_value
  FROM bot_config
  WHERE key = config_key;

  RETURN config_value;
END;
$$ LANGUAGE plpgsql;
