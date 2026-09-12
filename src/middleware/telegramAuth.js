import crypto from 'node:crypto'

// Validates the `initData` string Telegram gives the Mini App on launch.
// Docs: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
//
// This proves the request really came from Telegram and tells us which
// Telegram user is making it - without needing our own login system.
export function verifyInitData(initData, botToken) {
  if (!initData || !botToken) return null

  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return null
  params.delete('hash')

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  if (computedHash !== hash) return null

  // Telegram data is only valid for a short window - reject anything stale (24h here).
  const authDate = Number(params.get('auth_date') ?? 0)
  const ageSeconds = Date.now() / 1000 - authDate
  if (ageSeconds > 60 * 60 * 24) return null

  const userJson = params.get('user')
  return {
    user: userJson ? JSON.parse(userJson) : null,
    authDate,
  }
}

// Express middleware: expects the raw initData string in the
// `Authorization: tma <initData>` header (Telegram's recommended scheme).
export function telegramAuth(botToken) {
  return (req, res, next) => {
    const header = req.headers.authorization ?? ''
    const initData = header.startsWith('tma ') ? header.slice(4) : null

    const result = verifyInitData(initData, botToken)
    if (!result) {
      return res.status(401).json({ error: 'Invalid or missing Telegram auth' })
    }

    req.telegramUser = result.user
    next()
  }
}
