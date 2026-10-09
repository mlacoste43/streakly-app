// Real Postgres-backed data access. Replaces the old in-memory arrays -
// same function names/shapes as before, so the routes barely changed.
import { pool } from '../db.js'

// Called on every authenticated request so the Telegram user always
// exists in our `users` table before anything references it.
export async function ensureUser(telegramUser, timezone) {
  if (!telegramUser?.id) return
  await pool.query(
    `INSERT INTO users (id, first_name, username, photo_url, timezone)
     VALUES ($1, $2, $3, $4, COALESCE($5, 'UTC'))
     ON CONFLICT (id) DO UPDATE SET
       first_name = EXCLUDED.first_name,
       username = EXCLUDED.username,
       photo_url = COALESCE(EXCLUDED.photo_url, users.photo_url),
       timezone = COALESCE($5, users.timezone)`,
    [telegramUser.id, telegramUser.first_name ?? 'Без имени', telegramUser.username ?? null, telegramUser.photo_url ?? null, timezone ?? null]
  )
}

export async function getUserById(id) {
  const { rows } = await pool.query(
    'SELECT id, first_name, username, photo_url, timezone, streak_freezes, deadline_reminder_enabled, reminder_lead_hours FROM users WHERE id = $1',
    [id]
  )
  return rows[0] ?? null
}

export async function setDeadlineReminderEnabled(id, enabled) {
  const { rows } = await pool.query(
    `UPDATE users SET deadline_reminder_enabled = $2 WHERE id = $1
     RETURNING id, first_name, username, photo_url, timezone, streak_freezes, deadline_reminder_enabled, reminder_lead_hours`,
    [id, enabled]
  )
  return rows[0] ?? null
}

export async function setReminderLeadHours(id, hours) {
  const allowed = [1, 2, 3, 6, 12, 24]
  if (!allowed.includes(hours)) throw new Error('Invalid reminder lead time')
  const { rows } = await pool.query(
    `UPDATE users SET reminder_lead_hours = $2 WHERE id = $1
     RETURNING id, first_name, username, photo_url, timezone, streak_freezes, deadline_reminder_enabled, reminder_lead_hours`,
    [id, hours]
  )
  return rows[0] ?? null
}


export async function listHabitsForUser(userId) {
  const { rows } = await pool.query(
    `SELECT h.*,
            CASE WHEN h.break_rule = 'personal' THEN COALESCE(hms.streak_days, 0) ELSE h.days END AS personal_days,
            CASE WHEN h.break_rule = 'personal' THEN COALESCE(hms.record, 0) ELSE h.record END AS personal_record,
            CASE WHEN h.break_rule = 'personal' THEN COALESCE(hms.xp, 0) ELSE 0 END AS personal_xp
     FROM habits h
     JOIN habit_members hm ON hm.habit_id = h.id
     LEFT JOIN habit_member_stats hms ON hms.habit_id = h.id AND hms.user_id = $1
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
  await pool.query(
    'INSERT INTO habit_member_stats (habit_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [habit.id, ownerId]
  )
  return toHabitJson(habit)
}

// Marks today done for this user on this habit, and bumps the streak
// counter once per day (idempotent - checking in twice same day is a no-op).
// "Today" is computed in the checking-in user's own timezone, not the
// server's - so someone in Moscow checking in at 11pm and someone in
// New York checking in at 11pm both correctly log their own local day.
export async function checkIn(habitId, userId) {
  const { rows: membership } = await pool.query(
    `SELECT h.* FROM habits h
     JOIN habit_members hm ON hm.habit_id = h.id AND hm.user_id = $2
     WHERE h.id = $1`,
    [habitId, userId]
  )
  if (!membership[0]) return null

  const habitRow = membership[0]
  const inserted = await pool.query(
    `INSERT INTO check_ins (habit_id, user_id, checkin_date)
     SELECT $1, $2, (now() AT TIME ZONE u.timezone)::date
     FROM users u WHERE u.id = $2
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [habitId, userId]
  )

  if (inserted.rowCount > 0) {
    await pool.query(
      `INSERT INTO habit_member_stats (habit_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [habitId, userId]
    )

    if (habitRow.break_rule === 'personal') {
      // If the backend was asleep when the previous day ended, repair the
      // personal streak on the first check-in instead of relying only on cron.
      await pool.query(
        `UPDATE habit_member_stats hms
         SET streak_days = 0, updated_at = now()
         WHERE hms.habit_id = $1
           AND hms.user_id = $2
           AND EXISTS (
             SELECT 1 FROM users u WHERE u.id = $2
               AND NOT EXISTS (
                 SELECT 1 FROM check_ins ci
                 WHERE ci.habit_id = $1 AND ci.user_id = $2
                   AND ci.checkin_date = (now() AT TIME ZONE u.timezone)::date - INTERVAL '1 day'
               )
           )`,
        [habitId, userId]
      )

      const { rows } = await pool.query(
        `UPDATE habit_member_stats
         SET streak_days = streak_days + 1,
             record = GREATEST(record, streak_days + 1),
             xp = xp + 10,
             updated_at = now()
         WHERE habit_id = $1 AND user_id = $2
         RETURNING streak_days, record, xp`,
        [habitId, userId]
      )
      const stats = rows[0] ?? { streak_days: 0, record: 0, xp: 0 }
      const habit = toHabitJson({
        ...habitRow,
        personal_days: stats.streak_days,
        personal_record: stats.record,
        personal_xp: stats.xp,
      })
      return habit
    }

    const { rows } = await pool.query(
      `UPDATE habits
       SET days = days + 1, record = GREATEST(record, days + 1)
       WHERE id = $1
       RETURNING *`,
      [habitId]
    )
    return rows[0] ? toHabitJson(rows[0]) : null
  }

  if (habitRow.break_rule === 'personal') {
    const { rows } = await pool.query(
      `SELECT h.*, hms.streak_days AS personal_days, hms.record AS personal_record, hms.xp AS personal_xp
       FROM habits h
       LEFT JOIN habit_member_stats hms ON hms.habit_id = h.id AND hms.user_id = $2
       WHERE h.id = $1`,
      [habitId, userId]
    )
    return rows[0] ? toHabitJson(rows[0]) : null
  }

  return toHabitJson(habitRow)
}

export async function countHabitMembers(habitId) {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM habit_members WHERE habit_id = $1', [habitId])
  return rows[0].count
}

export async function isHabitMember(habitId, userId) {
  const { rows } = await pool.query(
    'SELECT 1 FROM habit_members WHERE habit_id = $1 AND user_id = $2',
    [habitId, userId]
  )
  return rows.length > 0
}

export async function joinHabit(habitId, userId) {
  await pool.query(
    'INSERT INTO habit_members (habit_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [habitId, userId]
  )
  await pool.query(
    'INSERT INTO habit_member_stats (habit_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [habitId, userId]
  )
  return findHabit(habitId)
}

export async function getTeamMembers(habitId) {
  return getHabitMembers(habitId)
}

// Works for any habit type (solo/duo/team) - who's on it and whether
// they've checked in today. Used for the team screen and the duo
// partner-status block on the habit-detail screen.
export async function getHabitMembers(habitId) {
  await pool.query(
    `INSERT INTO habit_member_stats (habit_id, user_id)
     SELECT habit_id, user_id FROM habit_members WHERE habit_id = $1
     ON CONFLICT (habit_id, user_id) DO NOTHING`,
    [habitId]
  )
  const { rows } = await pool.query(
    `SELECT u.id, u.first_name AS name, u.photo_url AS "avatarUrl",
            (ci.user_id IS NOT NULL) AS done,
            to_char(ci.checked_at, 'HH24:MI') AS time,
            COALESCE(hms.streak_days, 0) AS "streakDays",
            COALESCE(hms.record, 0) AS record,
            COALESCE(hms.xp, 0) AS xp
     FROM habit_members hm
     JOIN users u ON u.id = hm.user_id
     LEFT JOIN check_ins ci ON ci.habit_id = hm.habit_id AND ci.user_id = hm.user_id
       AND ci.checkin_date = (now() AT TIME ZONE u.timezone)::date
     LEFT JOIN habit_member_stats hms ON hms.habit_id = hm.habit_id AND hms.user_id = hm.user_id
     WHERE hm.habit_id = $1
     ORDER BY hms.xp DESC NULLS LAST, hms.streak_days DESC NULLS LAST, u.id`,
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

// Days in a given month that were saved by a streak freeze (instead of
// breaking the streak). Same string-date shape as getCheckInsForMonth.
export async function getFrozenDatesForMonth(habitId, year, month) {
  const { rows } = await pool.query(
    `SELECT freeze_date
     FROM freeze_uses
     WHERE habit_id = $1
       AND date_trunc('month', freeze_date) = date_trunc('month', make_date($2, $3, 1))
     ORDER BY freeze_date`,
    [habitId, year, month]
  )
  return rows.map((r) => r.freeze_date.toISOString().slice(0, 10))
}

// The core "don't break the streak" mechanic: any habit where NOBODY
// checked in yesterday loses its streak - unless someone already checked
// in today (streak already restarted, don't clobber it), OR the owner has
// a streak freeze available, in which case we spend one freeze instead of
// breaking the streak. Safe to run more than once a day.
//
// "Yesterday"/"today" are computed in the habit OWNER's timezone (a shared
// habit only has one streak counter, so we need a single day boundary for
// it - the owner's is the simplest reasonable choice). This does mean a
// duo/team habit's deadline effectively follows the owner's clock, not
// every member's - worth revisiting if that becomes a real complaint.
export async function resetMissedStreaks() {
  // Personal-rule habits keep an independent streak for every member.
  // XP is never removed when a personal streak is broken.
  await pool.query(
    `UPDATE habit_member_stats hms
     SET streak_days = 0, updated_at = now()
     FROM habits h, users u
     WHERE hms.habit_id = h.id
       AND u.id = hms.user_id
       AND h.break_rule = 'personal'
       AND hms.streak_days > 0
       AND NOT EXISTS (
         SELECT 1 FROM check_ins ci
         WHERE ci.habit_id = hms.habit_id
           AND ci.user_id = hms.user_id
           AND ci.checkin_date = (now() AT TIME ZONE u.timezone)::date - INTERVAL '1 day'
       )
       AND NOT EXISTS (
         SELECT 1 FROM check_ins ci
         WHERE ci.habit_id = hms.habit_id
           AND ci.user_id = hms.user_id
           AND ci.checkin_date = (now() AT TIME ZONE u.timezone)::date
       )`
  )

  const { rows: candidates } = await pool.query(
    `SELECT h.id, h.title, u.id AS owner_id, u.streak_freezes,
            ((now() AT TIME ZONE u.timezone)::date - INTERVAL '1 day')::date AS missed_date
     FROM habits h
     JOIN users u ON u.id = h.owner_id
     WHERE h.days > 0
       AND NOT EXISTS (
         SELECT 1 FROM check_ins ci
         WHERE ci.habit_id = h.id
           AND ci.checkin_date = (now() AT TIME ZONE u.timezone)::date - INTERVAL '1 day'
       )
       AND NOT EXISTS (
         SELECT 1 FROM check_ins ci
         WHERE ci.habit_id = h.id
           AND ci.checkin_date = (now() AT TIME ZONE u.timezone)::date
       )`
  )

  const broken = []
  const frozen = []

  for (const habit of candidates) {
    if (habit.streak_freezes > 0) {
      // spend one freeze: decrement the owner's balance and record which
      // day it saved, but leave the streak count untouched
      const { rowCount } = await pool.query(
        `UPDATE users SET streak_freezes = streak_freezes - 1
         WHERE id = $1 AND streak_freezes > 0`,
        [habit.owner_id]
      )
      if (rowCount > 0) {
        await pool.query(
          `INSERT INTO freeze_uses (habit_id, user_id, freeze_date)
           VALUES ($1, $2, $3)
           ON CONFLICT (habit_id, freeze_date) DO NOTHING`,
          [habit.id, habit.owner_id, habit.missed_date]
        )
        frozen.push({ id: habit.id, title: habit.title })
        continue
      }
      // fell through: someone else's concurrent request spent the last
      // freeze first - fall through to breaking the streak below
    }

    await pool.query('UPDATE habits SET days = 0 WHERE id = $1', [habit.id])
    broken.push({ id: habit.id, title: habit.title })
  }

  return { broken, frozen }
}

// Who needs a "deadline soon" nudge right now: for every habit member who
// (a) hasn't checked in yet today (their own local day), (b) has
// reminders turned on, (c) hasn't already been reminded today, and
// (d) is within the habit's reminder window (habits.deadline_hours,
// defaulting to 3) of their own local midnight.
//
// Deliberately per-member, not per-habit-owner: everyone on a shared
// habit gets their own nudge at the right moment in their own timezone.
export async function getPendingDeadlineReminders() {
  const { rows } = await pool.query(
    `SELECT hm.habit_id, h.title AS habit_title, u.id AS user_id,
            (now() AT TIME ZONE u.timezone)::date AS local_date
     FROM habit_members hm
     JOIN habits h ON h.id = hm.habit_id
     JOIN users u ON u.id = hm.user_id
     WHERE u.deadline_reminder_enabled = true
       AND NOT EXISTS (
         SELECT 1 FROM check_ins ci
         WHERE ci.habit_id = hm.habit_id AND ci.user_id = u.id
           AND ci.checkin_date = (now() AT TIME ZONE u.timezone)::date
       )
       AND NOT EXISTS (
         SELECT 1 FROM reminder_sent rs
         WHERE rs.habit_id = hm.habit_id AND rs.user_id = u.id
           AND rs.reminder_date = (now() AT TIME ZONE u.timezone)::date
       )
       AND EXTRACT(EPOCH FROM (
             date_trunc('day', now() AT TIME ZONE u.timezone) + INTERVAL '1 day'
             - (now() AT TIME ZONE u.timezone)
           )) / 3600.0 <= COALESCE(u.reminder_lead_hours, 3)`
  )
  return rows
}

export async function markReminderSent(habitId, userId, localDate) {
  await pool.query(
    `INSERT INTO reminder_sent (habit_id, user_id, reminder_date)
     VALUES ($1, $2, $3)
     ON CONFLICT (habit_id, user_id, reminder_date) DO NOTHING`,
    [habitId, userId, localDate]
  )
}

export async function updateHabit(id, { name, type, frequency, breakRule }) {
  const { rows } = await pool.query(
    `UPDATE habits
     SET title = COALESCE($2, title),
         type = COALESCE($3, type),
         frequency = COALESCE($4, frequency),
         break_rule = COALESCE($5, break_rule)
     WHERE id = $1
     RETURNING *`,
    [id, name, type, frequency, breakRule]
  )
  return rows[0] ? toHabitJson(rows[0]) : null
}

export async function deleteHabit(id) {
  const { rowCount } = await pool.query('DELETE FROM habits WHERE id = $1', [id])
  return rowCount > 0
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
    days: row.personal_days ?? row.days,
    record: row.personal_record ?? row.record,
    xp: Number(row.personal_xp ?? 0),
  }
}
