import pg from 'pg'

const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

pool.on('error', (err) => {
  console.error('Unexpected Postgres error on idle client', err)
})

// Auto-migration: add any missing columns so deploys never break
// on an existing database that predates a schema change.
pool.query(`
  ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';
`).catch((err) => console.error('Migration error:', err))
