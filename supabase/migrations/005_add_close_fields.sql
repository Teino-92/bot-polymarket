-- Add missing columns to positions table
ALTER TABLE positions 
ADD COLUMN IF NOT EXISTS exit_price DECIMAL,
ADD COLUMN IF NOT EXISTS pnl_eur DECIMAL,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS close_reason TEXT;
