-- Add email verification fields to users table
ALTER TABLE users ADD COLUMN email_verify_token text;
ALTER TABLE users ADD COLUMN email_verify_expiry timestamptz;

-- Add password reset fields to users table
ALTER TABLE users ADD COLUMN reset_password_token text;
ALTER TABLE users ADD COLUMN reset_password_expiry timestamptz;

-- Add brute force protection fields to users table
ALTER TABLE users ADD COLUMN failed_login_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until timestamptz;
