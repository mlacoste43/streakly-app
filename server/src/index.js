import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { telegramAuth } from './middleware/telegramAuth.js'
import { habitsRouter } from './routes/habits.js'

const app = express()
const PORT = process.env.PORT ?? 3000
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',')

app.use(cors({ origin: CORS_ORIGINS }))
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ ok: true }))

// Every route below requires a valid Telegram initData in the
// `Authorization: tma <initData>` header - unless ALLOW_DEV_AUTH=true,
// which lets requests through with no initData at all (local dev only).
app.use('/api', telegramAuth(BOT_TOKEN, { allowDevBypass: process.env.ALLOW_DEV_AUTH === 'true' }))

app.get('/api/me', (req, res) => res.json({ user: req.telegramUser }))
app.use('/api/habits', habitsRouter)

app.listen(PORT, () => {
  console.log(`Streakly API listening on http://localhost:${PORT}`)
  if (!BOT_TOKEN) {
    console.warn('WARNING: TELEGRAM_BOT_TOKEN is not set - all /api requests will be rejected. Copy .env.example to .env and fill it in.')
  }
})
