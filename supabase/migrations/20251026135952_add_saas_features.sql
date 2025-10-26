-- Drop existing RLS policies (they were Supabase-specific)
DROP POLICY IF EXISTS "Authenticated users can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update their clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can delete their clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view transactions for their clients" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert transactions for their clients" ON public.transactions;
DROP POLICY IF EXISTS "Users can update transactions for their clients" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete transactions for their clients" ON public.transactions;
DROP POLICY IF EXISTS "Users can view invoices for their clients" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert invoices for their clients" ON public.invoices;

-- Update users table with subscription fields
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user',
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) NOT NULL DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE;

-- Create subscription_payments table
CREATE TABLE IF NOT EXISTS public.subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_reference VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add user_id to transactions and invoices
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- Add new columns for multi-currency support
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS incoming_amount_thb DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS exchange_rate_mmk DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS payment_destination JSONB,
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(12,2);

-- Update existing rows
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

-- Add constraints after data migration
ALTER TABLE public.transactions 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.invoices
ALTER COLUMN user_id SET NOT NULL;

-- Create function to check subscription status
CREATE OR REPLACE FUNCTION check_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update status to suspended if subscription has expired
    UPDATE users 
    SET subscription_status = 'suspended'
    WHERE id = NEW.user_id 
    AND subscription_end_date < CURRENT_TIMESTAMP
    AND subscription_status = 'active';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check subscription on every transaction/invoice
CREATE TRIGGER check_subscription_before_transaction
    BEFORE INSERT OR UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION check_subscription_status();

CREATE TRIGGER check_subscription_before_invoice
    BEFORE INSERT OR UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION check_subscription_status();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user_id ON public.subscription_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_subscription_end_date ON public.users(subscription_end_date);

-- Create function to update subscription on payment
CREATE OR REPLACE FUNCTION update_subscription_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE users
        SET subscription_status = 'active',
            last_payment_date = NEW.payment_date,
            subscription_start_date = CASE 
                WHEN subscription_end_date IS NULL OR subscription_end_date < CURRENT_TIMESTAMP 
                THEN NEW.payment_date 
                ELSE subscription_start_date 
            END,
            subscription_end_date = CASE 
                WHEN subscription_end_date IS NULL OR subscription_end_date < CURRENT_TIMESTAMP 
                THEN NEW.payment_date + INTERVAL '1 month'
                ELSE subscription_end_date + INTERVAL '1 month'
            END
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscription payments
CREATE TRIGGER update_subscription_after_payment
    AFTER INSERT OR UPDATE ON public.subscription_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_on_payment();

-- Add updated_at trigger for subscription_payments
CREATE TRIGGER update_subscription_payments_updated_at
    BEFORE UPDATE ON public.subscription_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();