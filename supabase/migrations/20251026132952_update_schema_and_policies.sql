-- Drop existing RLS policies
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

-- Create new RLS policies
CREATE POLICY "Admin users can view all rows" ON public.clients
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Users can view their own rows" ON public.clients
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own rows" ON public.clients
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own rows" ON public.clients
FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own rows" ON public.clients
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Policies for transactions
CREATE POLICY "Admin users can view all transactions" ON public.transactions
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Users can view their transactions" ON public.transactions
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their transactions" ON public.transactions
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their transactions" ON public.transactions
FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their transactions" ON public.transactions
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Policies for invoices
CREATE POLICY "Admin users can view all invoices" ON public.invoices
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Users can view their invoices" ON public.invoices
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their invoices" ON public.invoices
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

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

-- Enable RLS for subscription_payments
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for subscription_payments
CREATE POLICY "Admin users can manage all subscription_payments" ON public.subscription_payments
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Users can view their own subscription_payments" ON public.subscription_payments
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Add trigger for updating timestamp
CREATE TRIGGER update_subscription_payments_updated_at
    BEFORE UPDATE ON public.subscription_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();