-- ============================================================
-- Migration 001 – Foundation Tables
-- RealmOs Database
-- Run this first on a fresh PostgreSQL database
-- ============================================================

-- Enable UUID generation (PostgreSQL 13+ has this built in)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  age           INT,
  height_cm     DECIMAL(5,2),
  weight_kg     DECIMAL(5,2),
  onboarded     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USER GOALS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_goals (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  daily_water_ml      INT         NOT NULL DEFAULT 3000,
  daily_protein_g     INT         NOT NULL DEFAULT 50,
  daily_steps         INT         NOT NULL DEFAULT 6000,
  sleep_hours         DECIMAL(3,1) NOT NULL DEFAULT 8.0,
  workout_days_week   INT         NOT NULL DEFAULT 4,
  monthly_savings_inr DECIMAL(10,2) NOT NULL DEFAULT 0,
  priority_areas      TEXT[]      DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- QUOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS quotes (
  id        UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  text      TEXT  NOT NULL,
  author    TEXT,
  category  TEXT  NOT NULL DEFAULT 'motivation'
);

-- ============================================================
-- SEED QUOTES
-- ============================================================
INSERT INTO quotes (text, author, category) VALUES
  ('She remembered who she was and the game changed.', 'Lalah Delia', 'power'),
  ('You are enough. A thousand times enough.', NULL, 'self-love'),
  ('Be the energy you want to attract.', NULL, 'motivation'),
  ('Your only limit is your mind.', NULL, 'motivation'),
  ('She is clothed in strength and dignity.', 'Proverbs 31:25', 'strength'),
  ('Glow differently. No competition.', NULL, 'power'),
  ('Do it with passion or not at all.', NULL, 'motivation'),
  ('You deserve the love you keep trying to give everyone else.', NULL, 'self-love'),
  ('She believed she could, so she did.', NULL, 'motivation'),
  ('Wake up. Kick ass. Repeat.', NULL, 'hustle'),
  ('The secret is to fall in love with yourself first.', NULL, 'self-love'),
  ('Good things take time. You are a good thing.', NULL, 'patience'),
  ('She is a mess of gorgeous chaos and she is enough.', NULL, 'self-love'),
  ('Make yourself a priority.', NULL, 'self-care'),
  ('Your vibe is your superpower.', NULL, 'power'),
  ('Be patient with yourself. You are growing.', NULL, 'growth'),
  ('Soft life is a lifestyle, not a moment.', NULL, 'self-care'),
  ('Let her sleep, for when she wakes, she will move mountains.', NULL, 'strength'),
  ('Discipline is choosing between what you want now and what you want most.', NULL, 'hustle'),
  ('You glow differently when you are actually happy.', NULL, 'joy');

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
