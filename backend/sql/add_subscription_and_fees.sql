-- Add subscription columns to users and fee/payment related columns to transactions and invoices
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(32) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS incoming_amount_thb NUMERIC,
  ADD COLUMN IF NOT EXISTS exchange_rate_mmk NUMERIC,
  ADD COLUMN IF NOT EXISTS payment_destination JSONB,
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC;

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS incoming_amount_thb NUMERIC,
  ADD COLUMN IF NOT EXISTS exchange_rate_mmk NUMERIC,
  ADD COLUMN IF NOT EXISTS payment_destination JSONB,
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC;

-- Ensure refresh_tokens table exists (created earlier) -- noop if present
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked BOOLEAN DEFAULT FALSE,
  UNIQUE(token)
);
