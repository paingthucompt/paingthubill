-- Add subscription related columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'inactive';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create subscription_payments table to track payment history
CREATE TABLE IF NOT EXISTS public.subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    amount NUMERIC(10,2) NOT NULL,
    payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscription_payments_updated_at
    BEFORE UPDATE ON public.subscription_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user_id ON public.subscription_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_payment_date ON public.subscription_payments(payment_date);