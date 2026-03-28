-- Migration 008: Add google_id column for Google OAuth sign-in.
-- Google users have a google_id but may not have a username or password_hash.

ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id
    ON users (google_id)
    WHERE google_id IS NOT NULL;
