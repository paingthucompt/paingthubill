-- Add missing columns
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS incoming_amount_thb DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS exchange_rate_mmk DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS payment_destination JSONB,
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id);

ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id);

-- Update existing rows to set user_id from clients table
UPDATE public.transactions t
SET user_id = c.user_id
FROM public.clients c
WHERE t.client_id = c.id
AND t.user_id IS NULL;

UPDATE public.invoices i
SET user_id = c.user_id
FROM public.clients c
WHERE i.client_id = c.id
AND i.user_id IS NULL;

-- Make user_id NOT NULL after setting values
ALTER TABLE public.transactions 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.invoices
ALTER COLUMN user_id SET NOT NULL;

-- Add new table for subscription tracking
CREATE TABLE IF NOT EXISTS public.subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    payment_method VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trigger for updating timestamp
CREATE TRIGGER update_subscription_payments_updated_at
    BEFORE UPDATE ON public.subscription_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();