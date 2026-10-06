// Thin wrapper around the Telegram WebApp SDK (window.Telegram.WebApp).
// Falls back gracefully when opened in a plain browser during development.

export const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null

export function initTelegram() {
  if (!tg) return
  tg.ready()
  tg.expand()
  // match Telegram's own chrome color to our app background
  tg.setHeaderColor?.('#FFFFFF')
  tg.setBackgroundColor?.('#FFFFFF')
}

export function getUser() {
  return tg?.initDataUnsafe?.user ?? { first_name: 'Гость', id: 0 }
}

export function hapticSelect() {
  tg?.HapticFeedback?.selectionChanged()
}

export function hapticImpact(style = 'light') {
  tg?.HapticFeedback?.impactOccurred(style)
}

// Reads the payload from a "direct link" that opened the Mini App, e.g.
// https://t.me/<bot>/<app>?startapp=invite_12_abc123 -> "invite_12_abc123".
// Falls back to the raw URL query string for easy testing in a plain
// browser (Telegram itself also exposes it there as tgWebAppStartParam).
export function getStartParam() {
  const fromTelegram = tg?.initDataUnsafe?.start_param
  if (fromTelegram) return fromTelegram
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('tgWebAppStartParam')
}

// Opens Telegram's native "share to chat" sheet for a link. Falls back to
// the clipboard when running outside Telegram (e.g. local dev in a browser).
export async function shareLink(url, text) {
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`)
    return
  }
  await navigator.clipboard.writeText(url)
  alert('Ссылка скопирована в буфер обмена')
}
