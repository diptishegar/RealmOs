# RealmOs – Database Schema

## Strategy

- PostgreSQL hosted on AWS EC2
- Migrations numbered: `001_init.sql`, `002_period.sql`, etc.
- Never drop or alter columns in old migrations — add new migration files
- All tables use `UUID` primary keys
- All timestamps in UTC

---

## Migration 001 – Foundation Tables

### users
Stores onboarding profile data for the single user.

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  age           INT,
  height_cm     DECIMAL(5,2),
  weight_kg     DECIMAL(5,2),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Migration 004–006 – Authentication Fields
Adds username/email and secure PIN storage.

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pin_hash               TEXT,
  ADD COLUMN IF NOT EXISTS email                  TEXT,
  ADD COLUMN IF NOT EXISTS password_hash          TEXT,
  ADD COLUMN IF NOT EXISTS reset_token_hash       TEXT,
  ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS username               TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
  ON users(email) WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_username_key
  ON users(username) WHERE username IS NOT NULL;
```
Notes:
- `password_hash` stores the bcrypt hash of the user's PIN.

### user_goals
Stores personalized targets set during onboarding.

```sql
CREATE TABLE user_goals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  daily_water_ml      INT DEFAULT 3000,
  daily_protein_g     INT DEFAULT 50,
  daily_steps         INT DEFAULT 6000,
  sleep_hours         DECIMAL(3,1) DEFAULT 8.0,
  workout_days_week   INT DEFAULT 4,
  monthly_savings     DECIMAL(10,2) DEFAULT 0,
  priority_areas      TEXT[],           -- e.g. ['health','fitness','diet']
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### quotes
Pre-seeded motivational quotes shown on startup.

```sql
CREATE TABLE quotes (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text      TEXT NOT NULL,
  author    TEXT,
  category  TEXT DEFAULT 'motivation'
);
```

---

## Migration 002 – Period Tracker

### period_cycles
One row per detected cycle.

```sql
CREATE TABLE period_cycles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date      DATE NOT NULL,
  end_date        DATE,
  cycle_length    INT,            -- days between cycles
  period_duration INT,            -- actual bleeding days
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### period_days
One row per day the user marks as a period day.

```sql
CREATE TABLE period_days (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date    DATE NOT NULL,
  flow_level  TEXT CHECK (flow_level IN ('light','medium','heavy','spotting')),
  symptoms    TEXT[],             -- e.g. ['cramps','bloating','headache']
  mood        TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);
```

### period_profile
User's period baseline (from onboarding).

```sql
CREATE TABLE period_profile (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  avg_cycle_length      INT DEFAULT 28,
  avg_period_duration   INT DEFAULT 5,
  last_period_start     DATE,
  relationship_with_period TEXT DEFAULT 'neutral',  -- 'yes'/'no'/'frenemy'
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Migration 003 – Sleep Tracker

```sql
CREATE TABLE sleep_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date        DATE NOT NULL,
  bedtime         TIME,
  wake_time       TIME,
  duration_hours  DECIMAL(4,2),
  quality         INT CHECK (quality BETWEEN 1 AND 5),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);
```

---

## Migration 004 – Water / Protein / Carbs

```sql
CREATE TABLE nutrition_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date      DATE NOT NULL,
  water_ml      INT DEFAULT 0,
  protein_g     DECIMAL(6,2) DEFAULT 0,
  carbs_g       DECIMAL(6,2) DEFAULT 0,
  calories      INT DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);
```

---

## Migration 005 – Exercise

```sql
CREATE TABLE exercise_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date        DATE NOT NULL,
  session_type    TEXT CHECK (session_type IN ('morning','evening','other')),
  workout_type    TEXT,            -- 'stretching','legs','core','cardio'
  duration_min    INT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Migration 006 – Diet / Meals

```sql
CREATE TABLE meal_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date      DATE NOT NULL,
  meal_type     TEXT CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  description   TEXT NOT NULL,
  protein_g     DECIMAL(6,2),
  carbs_g       DECIMAL(6,2),
  calories      INT,
  cost_inr      DECIMAL(8,2),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Migration 007 – Steps

```sql
CREATE TABLE step_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date    DATE NOT NULL,
  step_count  INT NOT NULL DEFAULT 0,
  goal        INT DEFAULT 6000,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);
```

---

## Migration 008 – Acne & Bloat

```sql
CREATE TABLE acne_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date    DATE NOT NULL,
  severity    INT CHECK (severity BETWEEN 1 AND 5),
  location    TEXT[],             -- e.g. ['chin','forehead','cheeks']
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

CREATE TABLE bloat_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date    DATE NOT NULL,
  severity    INT CHECK (severity BETWEEN 1 AND 5),
  triggers    TEXT[],             -- e.g. ['dairy','wheat','stress']
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);
```

---

## Migration 009 – Selfie Log

```sql
CREATE TABLE selfie_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date      DATE NOT NULL,
  image_path    TEXT NOT NULL,     -- local file path or S3 key
  mood          TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);
```

---

## Migration 010 – Savings & Investments

```sql
CREATE TABLE savings_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date    DATE NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  category    TEXT DEFAULT 'general',
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE investment_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date        DATE NOT NULL,
  type            TEXT CHECK (type IN ('mutual_fund','pf','fd','stocks','other')),
  name            TEXT,
  amount          DECIMAL(10,2) NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Indexes (added in migration 001)

```sql
-- Add after tables are created
CREATE INDEX idx_period_days_user_date     ON period_days(user_id, log_date);
CREATE INDEX idx_sleep_logs_user_date      ON sleep_logs(user_id, log_date);
CREATE INDEX idx_nutrition_logs_user_date  ON nutrition_logs(user_id, log_date);
CREATE INDEX idx_meal_logs_user_date       ON meal_logs(user_id, log_date);
CREATE INDEX idx_step_logs_user_date       ON step_logs(user_id, log_date);
CREATE INDEX idx_savings_logs_user_date    ON savings_logs(user_id, log_date);
```

---

## Entity Relationship Summary

```
users
  ├── user_goals         (1:1)
  ├── period_profile     (1:1)
  ├── period_cycles      (1:N)
  ├── period_days        (1:N)
  ├── sleep_logs         (1:N)
  ├── nutrition_logs     (1:N)
  ├── exercise_logs      (1:N)
  ├── meal_logs          (1:N)
  ├── step_logs          (1:N)
  ├── acne_logs          (1:N)
  ├── bloat_logs         (1:N)
  ├── selfie_logs        (1:N)
  ├── savings_logs       (1:N)
  └── investment_logs    (1:N)

quotes (standalone seed table)
```
