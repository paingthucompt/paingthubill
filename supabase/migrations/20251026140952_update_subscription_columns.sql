-- Rename subscription_expiry_date to subscription_end_date
ALTER TABLE public.users
RENAME COLUMN subscription_expiry_date TO subscription_end_date;

-- Add missing subscription columns
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE;