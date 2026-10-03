// Just enough to send messages via the Telegram Bot API - no grammY/polling
// needed since this bot doesn't (yet) need to receive commands.
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

// chatId for a private chat is the same as the user's Telegram id - but
// Telegram will only deliver if that user has opened a chat with the bot
// at least once (e.g. pressed Start), otherwise this fails with
// "Forbidden: bot was blocked by the user" or "chat not found".
export async function notifyUser(chatId, text) {
  if (!BOT_TOKEN) {
    console.warn('notifyUser: TELEGRAM_BOT_TOKEN not set, skipping notification')
    return
  }

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })

  const data = await res.json().catch(() => ({ ok: false, description: `HTTP ${res.status} (non-JSON response - check TELEGRAM_BOT_TOKEN is correct)` }))
  if (!data.ok) {
    // don't throw - a failed notification should never break the actual
    // check-in request, just log it so we can see what went wrong
    console.error('notifyUser failed:', data.description)
  }
  return data
}
