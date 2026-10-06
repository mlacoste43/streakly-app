import crypto from 'node:crypto'

// Invite tokens are stateless: an HMAC of the habit id, keyed by the bot
// token (secret, server-only). No DB table needed - anyone with a valid
// link can join, and the link never expires or gets "used up" (useful
// for a team you might keep adding people to). Reuses the bot token as
// the HMAC key purely for convenience - it's already a secret we have.
const SECRET = process.env.TELEGRAM_BOT_TOKEN ?? 'dev-insecure-secret'

export function generateInviteToken(habitId) {
  return crypto.createHmac('sha256', SECRET).update(String(habitId)).digest('hex').slice(0, 16)
}

export function verifyInviteToken(habitId, token) {
  if (!token) return false
  const expected = generateInviteToken(habitId)
  // constant-time compare to avoid leaking the valid token via timing
  const a = Buffer.from(token)
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// Builds the Telegram "direct link" that opens the Mini App with a
// start_param the frontend can read (see src/telegram.js getStartParam).
// Requires TELEGRAM_BOT_USERNAME and TELEGRAM_MINIAPP_SHORT_NAME to be set -
// both come from your conversation with @BotFather.
export function buildInviteLink(habitId) {
  const username = process.env.TELEGRAM_BOT_USERNAME
  const shortName = process.env.TELEGRAM_MINIAPP_SHORT_NAME
  if (!username || !shortName) return null

  const token = generateInviteToken(habitId)
  return `https://t.me/${username}/${shortName}?startapp=invite_${habitId}_${token}`
}
