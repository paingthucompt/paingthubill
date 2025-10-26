INSERT INTO users (email, password_hash, role, subscription_status, subscription_end_date)
VALUES ('admin@example.com', '$2b$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'admin', 'active', NOW() + INTERVAL '100 years')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
RETURNING id;
