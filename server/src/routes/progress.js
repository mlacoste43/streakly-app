import { Router } from 'express'
import { pool } from '../db.js'
export const progressRouter = Router()
// Auth middleware in index.js already sets req.telegramUser.
// All statistics are scoped to the authenticated user's retained check-ins.
progressRouter.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `WITH me AS (
        SELECT id, (now() AT TIME ZONE timezone)::date AS today
        FROM users WHERE id = $1
      ), mine AS (
        SELECT ci.habit_id, ci.checkin_date AS d, h.type
        FROM check_ins ci
        JOIN habit_members hm ON hm.habit_id = ci.habit_id AND hm.user_id = $1
        JOIN habits h ON h.id = ci.habit_id
        CROSS JOIN me
        WHERE ci.user_id = $1 AND ci.checkin_date <= me.today
      ), numbered AS (
        SELECT habit_id, d,
          d - (row_number() OVER (PARTITION BY habit_id ORDER BY d))::int AS grp,
          lag(d) OVER (PARTITION BY habit_id ORDER BY d) AS prev
        FROM mine
      ), runs AS (
        SELECT count(*)::int AS n FROM numbered GROUP BY habit_id, grp
      ), weeks AS (
        SELECT count(DISTINCT d)::int AS n FROM mine GROUP BY date_trunc('week', d)
      ), months AS (
        SELECT count(DISTINCT d)::int AS n FROM mine GROUP BY date_trunc('month', d)
      )
      SELECT
        to_char((SELECT today FROM me), 'YYYY-MM-DD') AS today,
        (SELECT count(*)::int FROM mine) AS completed,
        (SELECT count(DISTINCT d)::int FROM mine) AS "activeDays",
        COALESCE((SELECT max(n) FROM runs), 0) AS "bestStreak",
        COALESCE((SELECT max(n) FROM weeks), 0) AS "bestWeek",
        COALESCE((SELECT max(n) FROM months), 0) AS "bestMonth",
        (SELECT count(*)::int FROM mine WHERE type <> 'solo') AS "sharedCompleted",
        (SELECT count(*)::int FROM numbered WHERE d - prev > 1) AS comebacks`,
      [req.telegramUser.id]
    )
    res.set('Cache-Control', 'no-store').json({ stats: rows[0] })
  } catch (err) { next(err) }
})
