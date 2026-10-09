import { useEffect, useState } from 'react'
import { IconFlame, IconPlus, IconRun, IconLanguage, IconBook, IconUsers, IconUserCircle } from '@tabler/icons-react'
import StreakCard from '../components/StreakCard.jsx'
import { api } from '../api.js'
import { getCurrentWeekMonthKeys } from '../components/WeekCalendar.jsx'
import { useSettings } from '../context/SettingsContext.jsx'

const ICONS = { run: IconRun, language: IconLanguage, book: IconBook, users: IconUsers }

export default function MainScreen({ onOpenHabit, onCreateHabit, onOpenProfile, onOpenSettings }) {
  const { t, language } = useSettings()
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('solo')
  const [checkingId, setCheckingId] = useState(null)
  const [calendarData, setCalendarData] = useState({})
  const [memberData, setMemberData] = useState({})

  useEffect(() => {
    let active = true
    api.getHabits()
      .then(async (data) => {
        const loadedHabits = data.habits ?? []
        if (!active) return
        setHabits(loadedHabits)
        // The habits themselves are already loaded. Do not keep the whole
        // screen in the loading state while the calendar/check-in data
        // loads in the background.
        setLoading(false)

        const monthKeys = getCurrentWeekMonthKeys()
        const results = await Promise.all(
          loadedHabits.map(async (habit) => {
            try {
              const responses = await Promise.all(
                monthKeys.map((month) => api.getCheckIns(habit.id, month))
              )
              return [
                habit.id,
                {
                  dates: [...new Set(responses.flatMap((r) => r.dates ?? []))],
                  frozenDates: [...new Set(responses.flatMap((r) => r.frozenDates ?? []))],
                },
              ]
            } catch {
              return [habit.id, { dates: [], frozenDates: [] }]
            }
          })
        )

        if (active) setCalendarData(Object.fromEntries(results))

        const sharedHabits = loadedHabits.filter((habit) => habit.type === 'duo')
        const memberResults = await Promise.all(sharedHabits.map(async (habit) => {
          try {
            const response = await api.getMembers(habit.id)
            return [habit.id, response.members ?? []]
          } catch {
            return [habit.id, []]
          }
        }))
        if (active) setMemberData(Object.fromEntries(memberResults))
      })
      .catch((err) => {
        if (active) {
          setError(err.message)
          setLoading(false)
        }
      })
    return () => { active = false }
  }, [])

  async function handleCheckIn(habit) {
    if (checkingId != null) return
    setCheckingId(habit.id)
    try {
      const { habit: updated } = await api.checkIn(habit.id)
      setHabits((prev) => prev.map((h) => h.id === updated.id ? updated : h))

      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      setCalendarData((prev) => ({
        ...prev,
        [updated.id]: {
          ...(prev[updated.id] ?? {}),
          dates: [...new Set([...(prev[updated.id]?.dates ?? []), todayStr])],
        },
      }))

      if (habit.type === 'duo') {
        try {
          const response = await api.getMembers(habit.id)
          setMemberData((prev) => ({ ...prev, [habit.id]: response.members ?? [] }))
        } catch {
          // Keep the existing participant state if the refresh fails.
        }
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setCheckingId(null)
    }
  }

  function subtitleFor(h) {
    if (h.type === 'duo') return `${t('duoWith')} ${h.partner ?? '…'}`
    if (h.type === 'team') return t('team')
    if (h.deadlineHours) return `${t('solo')} · ${t('hoursLeft')} ${h.deadlineHours} ${t('hoursShort')}`
    return t('solo')
  }

  const soloHabits = habits.filter((h) => h.type === 'solo')
  const collective = habits.filter((h) => h.type === 'duo' || h.type === 'team')
  const visible = tab === 'together' ? collective : soloHabits
  const totalDays = habits.reduce((sum, h) => sum + (Number(h.days) || 0), 0)
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const dateLabel = today.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark" aria-hidden="true">✳</span><span>{t('appName')}</span></div>
        <div className="tagline">{t('tagline')}</div>
        <nav className="side-nav" aria-label={t('navChallenges')}>
          <button className={`nav-btn ${tab === 'solo' ? 'active' : ''}`} onClick={() => setTab('solo')} aria-current={tab === 'solo' ? 'page' : undefined}>🏁 <span>{t('navChallenges')}</span></button>
          <button className={`nav-btn ${tab === 'together' ? 'active' : ''}`} onClick={() => setTab('together')} aria-current={tab === 'together' ? 'page' : undefined}>👋 <span>{t('navTogether')}</span></button>
          <button className="nav-btn" onClick={onOpenProfile}>👤 <span>{t('profile')}</span></button>
          <button className="nav-btn" onClick={onOpenSettings}>⚙️ <span>{t('settings')}</span></button>
        </nav>
        <div className="sidebar-note"><strong>{t('sidebarNoteTitle')}</strong><p>{t('sidebarNoteText')}</p></div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <span className="eyebrow">{dateLabel}</span>
          <div className="top-actions">
            <span className="pill" title={t('totalFireDays')}>🔥 {totalDays}</span>
            <button className="profile-icon-btn" type="button" onClick={onOpenProfile} aria-label={t('profile')} title={t('profile')}>
              <IconUserCircle size={23} stroke={2} />
            </button>
          </div>
        </header>
        <section className="hero">
          <div className="hero-copy">
            <span className="badge">{t('heroBadge')}</span>
            <h1>{t('heroTitle1')}<br />{t('heroTitle2')}</h1>
            <p>{t('heroText')}</p>
            <button className="btn" onClick={onCreateHabit}><IconPlus size={19} />{t('newHabit')}</button>
          </div>
          <div className="mascot" aria-hidden="true"><span>🐸</span><small>{t('mascotText')}</small></div>
        </section>

        <section className="habits-section">
          <div className="section-head habits-section-head">
            <div>
              <h2>{tab === 'together' ? t('togetherHabits') : t('yourHabits')}</h2>
              <span className="small-muted">{visible.length} {t('totalCount')}</span>
            </div>
          </div>
          {loading && <div className="card-ng status-card" role="status">{t('loading')}</div>}
          {error && <div className="card-ng status-card error" role="alert">{t('loadError')}: {error}</div>}
          {!loading && !error && visible.length === 0 && <div className="card-ng status-card">{tab === 'together' ? t('emptyTogether') : t('emptyHabits')}</div>}
          <div className="habits-grid">
            {visible.map((h) => <StreakCard key={h.id} icon={ICONS[h.icon] ?? IconFlame} title={h.title} subtitle={subtitleFor(h)} days={h.days} record={h.record} variant={h.variant} needsCheckIn={!calendarData[h.id]?.dates?.includes(todayStr)} checkingIn={checkingId === h.id} people={h.type === 'duo' && h.partner ? [h.partner] : []} memberStatus={memberData[h.id] ?? []} checkedDates={calendarData[h.id]?.dates ?? []} frozenDates={calendarData[h.id]?.frozenDates ?? []} xp={h.xp ?? 0} personalRule={h.breakRule === 'personal'} onCheckIn={() => handleCheckIn(h)} onOpen={() => onOpenHabit?.(h)} />)}
          </div>
        </section>
      </main>
    </div>
  )
}
