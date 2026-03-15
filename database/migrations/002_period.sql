-- ============================================================
-- Migration 002 – Period Tracker
-- ============================================================

-- Period profile (from onboarding)
CREATE TABLE IF NOT EXISTS period_profile (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  avg_cycle_length          INT         NOT NULL DEFAULT 28,
  avg_period_duration       INT         NOT NULL DEFAULT 5,
  last_period_start         DATE,
  relationship_with_period  TEXT        NOT NULL DEFAULT 'neutral'
                              CHECK (relationship_with_period IN ('yes','no','frenemy','neutral')),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Individual period day logs
CREATE TABLE IF NOT EXISTS period_days (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date    DATE        NOT NULL,
  flow_level  TEXT        CHECK (flow_level IN ('light','medium','heavy','spotting')),
  symptoms    TEXT[]      DEFAULT '{}',
  mood        TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

-- Period cycles (auto-computed or manually added)
CREATE TABLE IF NOT EXISTS period_cycles (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date      DATE        NOT NULL,
  end_date        DATE,
  cycle_length    INT,
  period_duration INT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_period_days_user_date   ON period_days(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_period_cycles_user_start ON period_cycles(user_id, start_date);
