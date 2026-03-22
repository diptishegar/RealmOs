-- ============================================================
-- Migration 005 – Multi-user auth
-- Adds email, password, and password-reset fields to users.
-- Run after 004_auth.sql
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email                   TEXT,
  ADD COLUMN IF NOT EXISTS password_hash           TEXT,
  ADD COLUMN IF NOT EXISTS reset_token_hash        TEXT,
  ADD COLUMN IF NOT EXISTS reset_token_expires_at  TIMESTAMPTZ;

-- Unique emails (partial index allows existing NULL rows)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
  ON users(email) WHERE email IS NOT NULL;
