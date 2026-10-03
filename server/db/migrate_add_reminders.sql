-- Run once against an existing database that predates deadline reminders:
--   psql -d streakly -f db/migrate_add_reminders.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS deadline_reminder_enabled BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS reminder_sent (
  habit_id      INT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id       BIGINT NOT NULL REFERENCES users(id),
  reminder_date DATE NOT NULL,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (habit_id, user_id, reminder_date)
);
