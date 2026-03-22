-- ============================================================
-- Migration 004 – Auth: PIN-based login with JWT
-- Adds pin_hash column to users table.
-- Run: psql -U realmos_user -d realmos -f 004_auth.sql
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_hash TEXT;
