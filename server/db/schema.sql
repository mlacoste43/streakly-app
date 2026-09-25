-- Streakly schema. Run once against a fresh database:
--   psql -d streakly -f db/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id              BIGINT PRIMARY KEY,        -- Telegram user id
  first_name      TEXT NOT NULL,
  username        TEXT,
  timezone        TEXT NOT NULL DEFAULT 'UTC', -- IANA name, e.g. 'Europe/Moscow'; detected client-side
  streak_freezes  INT NOT NULL DEFAULT 2,      -- how many "skip a missed day for free" tokens the user has
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS habits (
  id             SERIAL PRIMARY KEY,
  owner_id       BIGINT NOT NULL REFERENCES users(id),
  title          TEXT NOT NULL,
  icon           TEXT NOT NULL DEFAULT 'flame',
  type           TEXT NOT NULL CHECK (type IN ('solo', 'duo', 'team')),
  frequency      TEXT NOT NULL DEFAULT 'daily', -- 'daily' | 'weekdays' | 'weekly'
  break_rule     TEXT NOT NULL DEFAULT 'all',   -- 'all' | 'personal'
  deadline_hours INT,                            -- hours before the daily deadline to warn, nullable
  days           INT NOT NULL DEFAULT 0,         -- current streak length, denormalized for quick reads
  record         INT NOT NULL DEFAULT 0,         -- longest streak ever reached
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Everyone (including the owner) holding a streak together on a habit.
-- For 'solo' habits this has exactly one row (the owner).
CREATE TABLE IF NOT EXISTS habit_members (
  habit_id  INT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id   BIGINT NOT NULL REFERENCES users(id),
  PRIMARY KEY (habit_id, user_id)
);

CREATE TABLE IF NOT EXISTS check_ins (
  habit_id    INT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id     BIGINT NOT NULL REFERENCES users(id),
  checkin_date DATE NOT NULL,
  checked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (habit_id, user_id, checkin_date)
);

CREATE INDEX IF NOT EXISTS idx_habit_members_user ON habit_members(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_habit_date ON check_ins(habit_id, checkin_date);

-- Records the specific days a streak freeze saved a habit from breaking,
-- so the month calendar can show a snowflake instead of a missed day.
CREATE TABLE IF NOT EXISTS freeze_uses (
  id          SERIAL PRIMARY KEY,
  habit_id    INT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id     BIGINT NOT NULL REFERENCES users(id), -- whose freeze token was spent (the habit owner)
  freeze_date DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (habit_id, freeze_date)
);

CREATE INDEX IF NOT EXISTS idx_freeze_uses_habit_date ON freeze_uses(habit_id, freeze_date);
