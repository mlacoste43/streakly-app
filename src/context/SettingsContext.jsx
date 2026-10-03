import { createContext, useContext, useEffect, useState } from 'react'
import { t as translate } from '../i18n.js'

const SettingsContext = createContext(null)

const STORAGE_KEY = 'streakly_settings'

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const defaults = {
  theme: 'light',
  language: 'ru',
  deadlineReminder: true,
  partnerAlert: true,
  reminderLeadHours: 3,
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => ({ ...defaults, ...loadStored() }))

  // persist on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  // actually apply the theme to the document so every screen's CSS variables update
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme)
  }, [settings.theme])

  function update(patch) {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  const value = {
    ...settings,
    setTheme: (theme) => update({ theme }),
    toggleTheme: () => update({ theme: settings.theme === 'dark' ? 'light' : 'dark' }),
    setLanguage: (language) => update({ language }),
    toggleLanguage: () => update({ language: settings.language === 'ru' ? 'en' : 'ru' }),
    setDeadlineReminder: (v) => update({ deadlineReminder: v }),
    setPartnerAlert: (v) => update({ partnerAlert: v }),
    setReminderLeadHours: (v) => update({ reminderLeadHours: v }),
    t: (key) => translate(key, settings.language),
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>')
  return ctx
}
