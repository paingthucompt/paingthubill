-- Add original_amount_usd column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN original_amount_usd NUMERIC(12,2);