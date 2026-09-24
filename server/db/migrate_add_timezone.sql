-- Run once against an existing database that was created before timezone
-- support was added:  psql -d streakly -f db/migrate_add_timezone.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';
