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
