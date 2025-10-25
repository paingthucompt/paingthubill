-- Add payment_destination column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN payment_destination JSONB;