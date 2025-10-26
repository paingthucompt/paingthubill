-- Add user ownership column to transactions table and backfill from clients
ALTER TABLE IF EXISTS public.transactions
  ADD COLUMN IF NOT EXISTS user_id UUID;

DO $$
BEGIN
  -- Populate user_id for any existing transactions using the owning client
  UPDATE public.transactions t
  SET user_id = c.user_id
  FROM public.clients c
  WHERE t.client_id = c.id
    AND t.user_id IS NULL;
END$$;

ALTER TABLE IF EXISTS public.transactions
  ALTER COLUMN user_id SET NOT NULL;

-- Ensure FK constraint and supporting index
ALTER TABLE IF EXISTS public.transactions
  ADD CONSTRAINT IF NOT EXISTS transactions_user_fk
  FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_transactions_user_id
  ON public.transactions (user_id);

-- Mirror ownership column on invoices and backfill using related client
ALTER TABLE IF EXISTS public.invoices
  ADD COLUMN IF NOT EXISTS user_id UUID;

DO $$
BEGIN
  UPDATE public.invoices i
  SET user_id = c.user_id
  FROM public.clients c
  WHERE i.client_id = c.id
    AND i.user_id IS NULL;
END$$;

ALTER TABLE IF EXISTS public.invoices
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE IF EXISTS public.invoices
  ADD CONSTRAINT IF NOT EXISTS invoices_user_fk
  FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_invoices_user_id
  ON public.invoices (user_id);

-- Prevent duplicate invoices for a transaction
ALTER TABLE IF EXISTS public.invoices
  ADD CONSTRAINT IF NOT EXISTS invoices_transaction_unique
  UNIQUE (transaction_id);

-- Ensure invoice numbers are generated automatically if missing on insert
ALTER TABLE IF EXISTS public.invoices
  ALTER COLUMN invoice_number SET DEFAULT public.generate_invoice_number();
