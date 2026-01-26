-- Migration: Créer la table bot_config pour stocker la configuration du bot

CREATE TABLE IF NOT EXISTS bot_config (
  id TEXT PRIMARY KEY,
  min_hvs_for_hold NUMERIC NOT NULL DEFAULT 5,
  min_flip_ev NUMERIC NOT NULL DEFAULT 3,
  stop_loss_percent NUMERIC NOT NULL DEFAULT 0.15,
  take_profit_percent NUMERIC NOT NULL DEFAULT 0.08,
  max_positions INTEGER NOT NULL DEFAULT 2,
  max_position_size_eur NUMERIC NOT NULL DEFAULT 75,
  is_paused BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer la configuration par défaut
INSERT INTO bot_config (
  id,
  min_hvs_for_hold,
  min_flip_ev,
  stop_loss_percent,
  take_profit_percent,
  max_positions,
  max_position_size_eur,
  is_paused
) VALUES (
  'default',
  5,
  3,
  0.15,
  0.08,
  2,
  75,
  false
) ON CONFLICT (id) DO NOTHING;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_bot_config_updated_at
  BEFORE UPDATE ON bot_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Commentaires pour documentation
COMMENT ON TABLE bot_config IS 'Configuration du bot de trading Polymarket';
COMMENT ON COLUMN bot_config.id IS 'Identifiant de la config (toujours "default")';
COMMENT ON COLUMN bot_config.min_hvs_for_hold IS 'HVS minimum pour ouvrir une position HOLD (en €)';
COMMENT ON COLUMN bot_config.min_flip_ev IS 'FlipEV minimum pour ouvrir une position FLIP (en €)';
COMMENT ON COLUMN bot_config.stop_loss_percent IS 'Pourcentage de stop-loss (0.15 = 15%)';
COMMENT ON COLUMN bot_config.take_profit_percent IS 'Pourcentage de take-profit (0.08 = 8%)';
COMMENT ON COLUMN bot_config.max_positions IS 'Nombre maximum de positions simultanées';
COMMENT ON COLUMN bot_config.max_position_size_eur IS 'Taille maximum par position (en €)';
COMMENT ON COLUMN bot_config.is_paused IS 'Si true, le bot ne prend plus de nouvelles positions';
