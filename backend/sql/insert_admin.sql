INSERT INTO users (email, password_hash, role, subscription_status, subscription_expiry_date)
VALUES ('admin@example.com', '$2a$12$bhc7I2DDFWDpkpUo7jslOe.OOzkyfmUvZjpehwmh1ahdzkiumbqOy', 'admin', 'active', now() + interval '10 years')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
RETURNING id;
