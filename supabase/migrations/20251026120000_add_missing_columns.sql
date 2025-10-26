-- Ensure required columns exist for transactions and invoices
-- Idempotent: uses IF NOT EXISTS where supported

-- Transactions: incoming_amount_thb, exchange_rate_mmk, payment_destination
ALTER TABLE IF EXISTS public.transactions
  ADD COLUMN IF NOT EXISTS incoming_amount_thb NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS exchange_rate_mmk NUMERIC(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS payment_destination JSONB;

-- Also ensure payout related columns exist
ALTER TABLE IF EXISTS public.transactions
  ADD COLUMN IF NOT EXISTS payout_currency TEXT DEFAULT 'THB',
  ADD COLUMN IF NOT EXISTS payout_amount NUMERIC(15,2);

-- Invoices: commission_amount
ALTER TABLE IF EXISTS public.invoices
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(15,2);

-- Make sure original_amount_usd exists (used by backend)
ALTER TABLE IF EXISTS public.transactions
  ADD COLUMN IF NOT EXISTS original_amount_usd NUMERIC(12,2);
