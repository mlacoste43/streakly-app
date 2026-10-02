import { useEffect, useState } from 'react'
import { IconFlame, IconSettings, IconPlus, IconRun, IconLanguage, IconBook, IconUsers } from '@tabler/icons-react'
import StreakCard from '../components/StreakCard.jsx'
import { api } from '../api.js'
import { useSettings } from '../context/SettingsContext.jsx'

// Backend sends the icon as a string (see server/src/data/store.js) - map it to a real icon here.
const ICONS = { run: IconRun, language: IconLanguage, book: IconBook, users: IconUsers }

export default function MainScreen({ onOpenHabit, onCreateHabit, onOpenSettings }) {
  const { t, language } = useSettings()
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .getHabits()
      .then((data) => setHabits(data.habits))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleCheckIn(habit) {
    try {
      const { habit: updated } = await api.checkIn(habit.id)
      setHabits((prev) => prev.map((h) => (h.id === updated.id ? updated : h)))
    } catch (err) {
      alert(err.message)
    }
  }

  function subtitleFor(h) {
    if (h.type === 'duo') return `${t('duoWith')} ${h.partner ?? '...'}`
    if (h.type === 'team') return t('team')
    if (h.deadlineHours) return `${t('solo')} · ${t('hoursLeft')} ${h.deadlineHours} ${t('hoursShort')}`
    return t('solo')
  }

  const totalDays = habits.reduce((sum, h) => sum + h.days, 0)
  // a habit with deadlineHours still needs today's check-in (same rule the old card used)
  const safeCount = habits.filter((h) => !h.deadlineHours).length
  const allSafe = habits.length > 0 && safeCount === habits.length

  const dateLabel = new Date().toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div style={{ padding: 16, paddingBottom: 40, maxWidth: 480, margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
        <div className="eyebrow">{dateLabel}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="pill" title={t('totalFireDays')}>🔥 {totalDays}</div>
          <button className="tile-btn" onClick={onOpenSettings} aria-label={t('settings')}>
            <IconSettings size={20} />
          </button>
        </div>
      </header>

      <section className="hero">
        <div>
          <span className="badge">{t('heroBadge')}</span>
          <h1>
            {t('heroTitle1')}
            <br />
            {t('heroTitle2')}
          </h1>
          <p>{t('heroText')}</p>
          <button className="btn" onClick={onCreateHabit}>
            <IconPlus size={18} />
            {t('newHabit')}
          </button>
        </div>
        <div className="mascot" aria-hidden="true">🐸</div>
      </section>

      {habits.length > 0 && (
        <section className="card-ng" style={{ marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>🎯 {t('planToday')}</h3>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {allSafe ? t('planAllDone') : t('planKeepGoing')}
          </div>
          <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1.2, margin: '12px 0' }}>
            {safeCount}{' '}
            <span style={{ color: 'var(--text-secondary)', fontSize: 20 }}>/ {habits.length}</span>
          </div>
          <div className="track">
            <div className="fill" style={{ width: `${(safeCount / habits.length) * 100}%` }} />
          </div>
        </section>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontSize: 21, margin: 0, letterSpacing: -0.5 }}>{t('yourHabits')}</h2>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {habits.length} {t('totalCount')}
        </span>
      </div>

      {loading && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('loading')}</p>}
      {error && (
        <p style={{ fontSize: 13, color: 'var(--danger-icon)' }}>
          {t('loadError')}: {error}
        </p>
      )}
      {!loading && !error && habits.length === 0 && (
        <div className="card-ng" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 28 }}>
          {t('emptyHabits')}
        </div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {habits.map((h) => (
          <StreakCard
            key={h.id}
            icon={ICONS[h.icon] ?? IconFlame}
            title={h.title}
            subtitle={subtitleFor(h)}
            days={h.days}
            record={h.record}
            variant={h.variant}
            needsCheckIn={Boolean(h.deadlineHours)}
            people={h.type === 'duo' && h.partner ? [h.partner] : []}
            onCheckIn={() => handleCheckIn(h)}
            onOpen={() => onOpenHabit?.(h)}
          />
        ))}
      </div>

      <section className="tip-card" style={{ marginTop: 20 }}>
        <h3>💜 {t('tipTitle')}</h3>
        <p>{t('tipText')}</p>
      </section>
    </div>
  )
}
