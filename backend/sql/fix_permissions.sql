-- First, connect as superuser to grant permissions
\c paingthubill_db postgres;

-- Grant all privileges on schema
GRANT ALL ON SCHEMA public TO paingthubill_user;

-- Grant all privileges on all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO paingthubill_user;

-- Grant all privileges on all sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO paingthubill_user;

-- Grant connect permission
GRANT CONNECT ON DATABASE paingthubill_db TO paingthubill_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL ON TABLES TO paingthubill_user;

-- Update tables ownership
ALTER TABLE public.users OWNER TO paingthubill_user;
ALTER TABLE public.clients OWNER TO paingthubill_user;
ALTER TABLE public.transactions OWNER TO paingthubill_user;
ALTER TABLE public.invoices OWNER TO paingthubill_user;

-- Ensure user can create new tables (needed for migrations)
GRANT CREATE ON SCHEMA public TO paingthubill_user;