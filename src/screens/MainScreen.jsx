import { useEffect, useState } from 'react'
import { IconFlame, IconPlus, IconRun, IconLanguage, IconBook, IconUsers } from '@tabler/icons-react'
import StreakCard from '../components/StreakCard.jsx'
import { api } from '../api.js'
import { useSettings } from '../context/SettingsContext.jsx'

const ICONS = { run: IconRun, language: IconLanguage, book: IconBook, users: IconUsers }

export default function MainScreen({ onOpenHabit, onCreateHabit, onOpenProfile, onOpenSettings }) {
  const { t, language } = useSettings()
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('all')
  const [checkingId, setCheckingId] = useState(null)

  useEffect(() => {
    let active = true
    api.getHabits()
      .then((data) => { if (active) setHabits(data.habits ?? []) })
      .catch((err) => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function handleCheckIn(habit) {
    if (checkingId != null) return
    setCheckingId(habit.id)
    try {
      const { habit: updated } = await api.checkIn(habit.id)
      setHabits((prev) => prev.map((h) => h.id === updated.id ? updated : h))
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

  const collective = habits.filter((h) => h.type === 'duo' || h.type === 'team')
  const visible = tab === 'together' ? collective : habits
  const totalDays = habits.reduce((sum, h) => sum + (Number(h.days) || 0), 0)
  const dateLabel = new Date().toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark" aria-hidden="true">✳</span><span>{t('appName')}</span></div>
        <div className="tagline">{t('tagline')}</div>
        <nav className="side-nav" aria-label={t('navChallenges')}>
          <button className={`nav-btn ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')} aria-current={tab === 'all' ? 'page' : undefined}>🏁 <span>{t('navChallenges')}</span></button>
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
          <div className="section-head"><h2>{tab === 'together' ? t('togetherHabits') : t('yourHabits')}</h2><span className="small-muted">{visible.length} {t('totalCount')}</span></div>
          {loading && <div className="card-ng status-card" role="status">{t('loading')}</div>}
          {error && <div className="card-ng status-card error" role="alert">{t('loadError')}: {error}</div>}
          {!loading && !error && visible.length === 0 && <div className="card-ng status-card">{tab === 'together' ? t('emptyTogether') : t('emptyHabits')}</div>}
          <div className="habits-grid">
            {visible.map((h) => <StreakCard key={h.id} icon={ICONS[h.icon] ?? IconFlame} title={h.title} subtitle={subtitleFor(h)} days={h.days} record={h.record} variant={h.variant} needsCheckIn={Boolean(h.deadlineHours)} checkingIn={checkingId === h.id} people={h.type === 'duo' && h.partner ? [h.partner] : []} onCheckIn={() => handleCheckIn(h)} onOpen={() => onOpenHabit?.(h)} />)}
          </div>
        </section>
      </main>
    </div>
  )
}
