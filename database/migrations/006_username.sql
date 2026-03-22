-- Migration 006: Add unique username for username/password authentication.
-- Google SSO users have email but no username.
-- Username/password users have username but no email.

ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_username_key
    ON users (username)
    WHERE username IS NOT NULL;
