-- Add column to store the source platform payout ID directly on transactions
-- This follows the same pattern as payment_destination
ALTER TABLE public.transactions 
ADD COLUMN source_platform_payout_id TEXT;