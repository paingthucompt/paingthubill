-- Strengthen ownership constraints for multi-tenant SaaS behaviour
ALTER TABLE IF EXISTS public.clients
  ADD CONSTRAINT IF NOT EXISTS clients_user_fk
  FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_clients_user_id
  ON public.clients (user_id);

-- Normalise numeric defaults to avoid NULL math downstream
ALTER TABLE IF EXISTS public.transactions
  ALTER COLUMN payout_amount SET DEFAULT 0,
  ALTER COLUMN exchange_rate_mmk SET DEFAULT 0;

ALTER TABLE IF EXISTS public.invoices
  ALTER COLUMN commission_amount SET DEFAULT 0,
  ALTER COLUMN total_amount SET DEFAULT 0,
  ALTER COLUMN net_amount SET DEFAULT 0;
