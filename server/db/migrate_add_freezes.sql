-- Run once against an existing database that predates streak freezes:
--   psql -d streakly -f db/migrate_add_freezes.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_freezes INT NOT NULL DEFAULT 2;

CREATE TABLE IF NOT EXISTS freeze_uses (
  id          SERIAL PRIMARY KEY,
  habit_id    INT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id     BIGINT NOT NULL REFERENCES users(id),
  freeze_date DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (habit_id, freeze_date)
);

CREATE INDEX IF NOT EXISTS idx_freeze_uses_habit_date ON freeze_uses(habit_id, freeze_date);
