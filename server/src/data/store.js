// Real Postgres-backed data access. Replaces the old in-memory arrays -
// same function names/shapes as before, so the routes barely changed.
import { pool } from '../db.js'

// Called on every authenticated request so the Telegram user always
// exists in our `users` table before anything references it.
export async function ensureUser(telegramUser) {
  if (!telegramUser?.id) return
  await pool.query(
    `INSERT INTO users (id, first_name, username)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name, username = EXCLUDED.username`,
    [telegramUser.id, telegramUser.first_name ?? 'Без имени', telegramUser.username ?? null]
  )
}

export async function listHabitsForUser(userId) {
  const { rows } = await pool.query(
    `SELECT h.*
     FROM habits h
     JOIN habit_members hm ON hm.habit_id = h.id
     WHERE hm.user_id = $1
     ORDER BY h.id`,
    [userId]
  )
  return rows.map(toHabitJson)
}

export async function findHabit(id) {
  const { rows } = await pool.query('SELECT * FROM habits WHERE id = $1', [id])
  return rows[0] ? toHabitJson(rows[0]) : null
}

export async function addHabit({ ownerId, name, type, frequency, breakRule }) {
  const { rows } = await pool.query(
    `INSERT INTO habits (owner_id, title, icon, type, frequency, break_rule)
     VALUES ($1, $2, 'flame', $3, $4, $5)
     RETURNING *`,
    [ownerId, name, type ?? 'solo', frequency ?? 'daily', breakRule ?? 'all']
  )
  const habit = rows[0]
  await pool.query('INSERT INTO habit_members (habit_id, user_id) VALUES ($1, $2)', [habit.id, ownerId])
  return toHabitJson(habit)
}

// Marks today done for this user on this habit, and bumps the streak
// counter once per day (idempotent - checking in twice same day is a no-op).
export async function checkIn(habitId, userId) {
  const inserted = await pool.query(
    `INSERT INTO check_ins (habit_id, user_id, checkin_date)
     VALUES ($1, $2, CURRENT_DATE)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [habitId, userId]
  )

  if (inserted.rowCount > 0) {
    const { rows } = await pool.query(
      `UPDATE habits
       SET days = days + 1, record = GREATEST(record, days + 1)
       WHERE id = $1
       RETURNING *`,
      [habitId]
    )
    return rows[0] ? toHabitJson(rows[0]) : null
  }

  return findHabit(habitId)
}

export async function getTeamMembers(habitId) {
  return getHabitMembers(habitId)
}

// Works for any habit type (solo/duo/team) - who's on it and whether
// they've checked in today. Used for the team screen and the duo
// partner-status block on the habit-detail screen.
export async function getHabitMembers(habitId) {
  const { rows } = await pool.query(
    `SELECT u.id, u.first_name AS name,
            (ci.user_id IS NOT NULL) AS done,
            to_char(ci.checked_at, 'HH24:MI') AS time
     FROM habit_members hm
     JOIN users u ON u.id = hm.user_id
     LEFT JOIN check_ins ci ON ci.habit_id = hm.habit_id AND ci.user_id = hm.user_id AND ci.checkin_date = CURRENT_DATE
     WHERE hm.habit_id = $1
     ORDER BY u.id`,
    [habitId]
  )
  return rows
}

// All check-in dates for a habit within a given month (any member's
// check-in counts as "done" for that day - matches the "one miss breaks
// it for everyone" model). Returns an array of 'YYYY-MM-DD' strings.
export async function getCheckInsForMonth(habitId, year, month) {
  const { rows } = await pool.query(
    `SELECT DISTINCT checkin_date
     FROM check_ins
     WHERE habit_id = $1
       AND date_trunc('month', checkin_date) = date_trunc('month', make_date($2, $3, 1))
     ORDER BY checkin_date`,
    [habitId, year, month]
  )
  return rows.map((r) => r.checkin_date.toISOString().slice(0, 10))
}

// The core "don't break the streak" mechanic: any habit where NOBODY
// checked in yesterday loses its streak - unless someone already checked
// in today, which means the streak was already (re)started and shouldn't
// be clobbered by a reset job that happens to run again the same day.
// Safe to run more than once a day.
export async function resetMissedStreaks() {
  const { rows } = await pool.query(
    `UPDATE habits h
     SET days = 0
     WHERE h.days > 0
       AND NOT EXISTS (
         SELECT 1 FROM check_ins ci
         WHERE ci.habit_id = h.id
           AND ci.checkin_date = CURRENT_DATE - INTERVAL '1 day'
       )
       AND NOT EXISTS (
         SELECT 1 FROM check_ins ci
         WHERE ci.habit_id = h.id
           AND ci.checkin_date = CURRENT_DATE
       )
     RETURNING h.id, h.title`
  )
  return rows
}

function toHabitJson(row) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    icon: row.icon,
    variant: row.type,
    type: row.type,
    frequency: row.frequency,
    breakRule: row.break_rule,
    deadlineHours: row.deadline_hours,
    days: row.days,
    record: row.record,
  }
}
