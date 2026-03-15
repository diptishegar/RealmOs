-- ============================================================
-- Migration 003 – Sleep, Nutrition, Exercise, Steps
-- ============================================================

-- Sleep logs
CREATE TABLE IF NOT EXISTS sleep_logs (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date        DATE         NOT NULL,
  bedtime         TIME,
  wake_time       TIME,
  duration_hours  DECIMAL(4,2),
  quality         INT          CHECK (quality BETWEEN 1 AND 5),
  notes           TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

-- Nutrition (water, protein, carbs per day)
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date      DATE         NOT NULL,
  water_ml      INT          NOT NULL DEFAULT 0,
  protein_g     DECIMAL(6,2) NOT NULL DEFAULT 0,
  carbs_g       DECIMAL(6,2) NOT NULL DEFAULT 0,
  calories      INT          NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

-- Meal logs (breakfast, lunch, dinner, snack)
CREATE TABLE IF NOT EXISTS meal_logs (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date      DATE         NOT NULL,
  meal_type     TEXT         NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  description   TEXT         NOT NULL,
  protein_g     DECIMAL(6,2),
  carbs_g       DECIMAL(6,2),
  calories      INT,
  cost_inr      DECIMAL(8,2),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Exercise logs
CREATE TABLE IF NOT EXISTS exercise_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date        DATE        NOT NULL,
  session_type    TEXT        CHECK (session_type IN ('morning','evening','other')),
  workout_type    TEXT,
  duration_min    INT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step logs
CREATE TABLE IF NOT EXISTS step_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date    DATE        NOT NULL,
  step_count  INT         NOT NULL DEFAULT 0,
  goal        INT         NOT NULL DEFAULT 6000,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date      ON sleep_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date  ON nutrition_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date       ON meal_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_step_logs_user_date       ON step_logs(user_id, log_date);
