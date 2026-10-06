import pg from 'pg'

const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

pool.on('error', (err) => {
  console.error('Unexpected Postgres error on idle client', err)
})

// Small automatic migrations for existing Render databases.
// This means you do NOT need to open a SQL console after deploying.
export async function ensureDatabaseSchema() {
  if (!process.env.DATABASE_URL) return

  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS photo_url TEXT;

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS deadline_reminder_enabled BOOLEAN NOT NULL DEFAULT true;

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS reminder_lead_hours INT NOT NULL DEFAULT 3;

    CREATE TABLE IF NOT EXISTS reminder_sent (
      habit_id      INT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      user_id       BIGINT NOT NULL REFERENCES users(id),
      reminder_date DATE NOT NULL,
      sent_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (habit_id, user_id, reminder_date)
    );

    CREATE TABLE IF NOT EXISTS habit_member_stats (
      habit_id       INT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      user_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      streak_days    INT NOT NULL DEFAULT 0,
      record         INT NOT NULL DEFAULT 0,
      xp             INT NOT NULL DEFAULT 0,
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (habit_id, user_id)
    );

    INSERT INTO habit_member_stats (habit_id, user_id)
    SELECT hm.habit_id, hm.user_id
    FROM habit_members hm
    ON CONFLICT (habit_id, user_id) DO NOTHING;
  `)

  console.log('Database schema check: reminder settings, avatars and personal streak XP are ready')
}
