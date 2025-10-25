-- Add platform_details column to clients table
ALTER TABLE public.clients 
ADD COLUMN platform_details JSONB DEFAULT '[]'::jsonb;

-- Add source_platform column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN source_platform TEXT;