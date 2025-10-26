-- Idempotent schema creation for local development / DB provisioning
-- Run as a DB superuser or a role that can CREATE TABLE in schema public.
-- This file mirrors the supabase initial schema so the backend can run.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  bank_account JSONB DEFAULT '[]'::jsonb,
  commission_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  preferred_payout_currency TEXT NOT NULL DEFAULT 'THB',
  platform_details JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);

-- Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  incoming_amount_thb NUMERIC(15,2),
  original_amount_usd NUMERIC(12,2),
  fees NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  exchange_rate_mmk NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  payout_currency TEXT NOT NULL DEFAULT 'THB',
  payout_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  source_platform TEXT,
  source_platform_payout_id TEXT,
  payment_destination JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON public.transactions(client_id);

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE DEFAULT public.generate_invoice_number(),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_transaction_unique ON public.invoices(transaction_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);

-- Safe triggers / helper function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_clients_updated_at'
  ) THEN
    CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_transactions_updated_at'
  ) THEN
    CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- Basic invoice number generator if not present
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $function$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.invoices;
  RETURN 'PT-' || LPAD(next_number::TEXT, 6, '0');
END;
$function$;

-- NOTE: In some hosted DBs the DB user does not have CREATE privileges. If you see
-- "permission denied for schema public" you must run these statements as a superuser
-- or ask your DBA to provision the schema. This file is provided to make local
-- provisioning straightforward and idempotent.
