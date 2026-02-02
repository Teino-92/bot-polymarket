-- Migration: Corriger le conflit des tables bot_config et mettre à jour la taille des positions

-- 1. Supprimer l'ancienne table bot_config (format key-value de 004_bot_config.sql)
-- Cette table n'est pas utilisée par le code
DROP TABLE IF EXISTS bot_config CASCADE;
DROP FUNCTION IF EXISTS get_bot_config(TEXT);

-- 2. Recréer la table bot_config avec la bonne structure (format colonnes de 005_bot_config_table.sql)
CREATE TABLE IF NOT EXISTS bot_config (
  id TEXT PRIMARY KEY,
  min_hvs_for_hold NUMERIC NOT NULL DEFAULT 5,
  min_flip_ev NUMERIC NOT NULL DEFAULT 3,
  stop_loss_percent NUMERIC NOT NULL DEFAULT 0.15,
  take_profit_percent NUMERIC NOT NULL DEFAULT 0.08,
  max_positions INTEGER NOT NULL DEFAULT 2,
  max_position_size_eur NUMERIC NOT NULL DEFAULT 5,  -- ✅ Changé de 75 à 5
  is_paused BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Mettre à jour ou insérer la configuration avec les bonnes valeurs
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
  5,  -- ✅ 5€ au lieu de 75€
  false
) ON CONFLICT (id) DO UPDATE SET
  max_position_size_eur = 5,  -- ✅ Forcer la mise à jour à 5€
  updated_at = NOW();

-- 4. Trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS update_bot_config_updated_at ON bot_config;
CREATE TRIGGER update_bot_config_updated_at
  BEFORE UPDATE ON bot_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Commentaires pour documentation
COMMENT ON TABLE bot_config IS 'Configuration du bot de trading Polymarket (table unique et correcte)';
COMMENT ON COLUMN bot_config.max_position_size_eur IS 'Taille maximum par position en € (ajusté à 5€ pour petit capital)';
