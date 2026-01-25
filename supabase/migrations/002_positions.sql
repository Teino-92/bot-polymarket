-- ---------------------------------------------------
-- TABLE: positions
-- Limite: max 2 positions actives
-- ---------------------------------------------------

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
    status TEXT NOT NULL DEFAULT 'OPEN', -- Ajout pour trigger
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------
-- FUNCTION: check_positions_limit()
-- Vérifie qu'il n'y a pas plus de 2 positions actives
-- ---------------------------------------------------

CREATE OR REPLACE FUNCTION check_positions_limit()
RETURNS trigger AS $$
BEGIN
    -- Compte uniquement les positions avec status = 'OPEN'
    IF (SELECT COUNT(*) FROM positions WHERE status = 'OPEN') >= 2 THEN
        RAISE EXCEPTION 'Cannot have more than 2 active positions';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------
-- TRIGGER: positions_limit_trigger
-- S'exécute avant insert ou update
-- ---------------------------------------------------

CREATE TRIGGER positions_limit_trigger
BEFORE INSERT OR UPDATE ON positions
FOR EACH ROW
WHEN (NEW.status = 'OPEN')
EXECUTE FUNCTION check_positions_limit();
