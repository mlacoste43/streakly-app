import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { telegramAuth } from './middleware/telegramAuth.js'
import { habitsRouter } from './routes/habits.js'
import { scheduleStreakReset, runStreakReset } from './cron/resetStreaks.js'

const app = express()
const PORT = process.env.PORT ?? 3000
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',')
const ALLOW_DEV_AUTH = process.env.ALLOW_DEV_AUTH === 'true'

app.use(cors({ origin: CORS_ORIGINS }))
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ ok: true }))

// Every route below requires a valid Telegram initData in the
// `Authorization: tma <initData>` header - unless ALLOW_DEV_AUTH=true,
// which lets requests through with no initData at all (local dev only).
app.use('/api', telegramAuth(BOT_TOKEN, { allowDevBypass: ALLOW_DEV_AUTH }))

app.get('/api/me', (req, res) => res.json({ user: req.telegramUser }))
app.use('/api/habits', habitsRouter)

// Dev-only: trigger the daily streak-reset job on demand instead of waiting for 00:05.
if (ALLOW_DEV_AUTH) {
  app.post('/api/dev/run-streak-reset', async (req, res, next) => {
    try {
      const broken = await runStreakReset()
      res.json({ broken })
    } catch (err) {
      next(err)
    }
  })
}

// catches any error passed to next(err) from the routes above
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Streakly API listening on http://localhost:${PORT}`)
  if (!BOT_TOKEN) {
    console.warn('WARNING: TELEGRAM_BOT_TOKEN is not set - all /api requests will be rejected. Copy .env.example to .env and fill it in.')
  }
  if (!process.env.DATABASE_URL) {
    console.warn('WARNING: DATABASE_URL is not set - database queries will fail.')
  }
  scheduleStreakReset()
})
