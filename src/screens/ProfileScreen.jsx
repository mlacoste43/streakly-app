import { useEffect, useMemo, useState } from 'react'
import {
  IconArrowLeft,
  IconFlame,
  IconCalendarCheck,
  IconTrophy,
  IconSnowflake,
  IconTarget,
} from '@tabler/icons-react'
import { api } from '../api.js'
import { useSettings } from '../context/SettingsContext.jsx'

export default function ProfileScreen({ onBack, user }) {
  const { t } = useSettings()
  const [habits, setHabits] = useState([])
  const [freezes, setFreezes] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    Promise.all([api.getHabits(), api.getMe()])
      .then(([habitsRes, meRes]) => {
        if (!active) return
        setHabits(habitsRes.habits ?? [])
        setFreezes(meRes.user?.streak_freezes ?? 0)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const stats = useMemo(() => {
    const currentDays = habits.reduce((sum, h) => sum + (Number(h.days) || 0), 0)
    const totalRecord = null // Legacy route: do not label the sum of records as completions.
    const bestRecord = habits.reduce((max, h) => Math.max(max, Number(h.record) || 0), 0)

    return {
      currentDays,
      totalRecord,
      bestRecord,
      habitsCount: habits.length,
    }
  }, [habits])

  const achievements = [
    { icon: '🌱', title: t('achievementFirst'), unlocked: habits.length > 0 },
    { icon: '🔥', title: t('achievement7'), unlocked: stats.bestRecord >= 7 },
    { icon: '🔥', title: t('achievement30'), unlocked: stats.bestRecord >= 30 },
    { icon: '🏆', title: t('achievement100'), unlocked: stats.bestRecord >= 100 },
    { icon: '🤝', title: t('achievementTogether'), unlocked: habits.some(h => h.type === 'duo' || h.type === 'team') },
  ]

  const displayUser = user ?? {}
  const firstName = displayUser.first_name ?? t('guest')
  const username = displayUser.username ? `@${displayUser.username}` : t('noUsername')

  return (
    <div className="profile-screen">
      <div className="screen-header">
        <button className="back-btn" onClick={onBack} aria-label={t('back')}>
          <IconArrowLeft size={21} />
        </button>
        <p>{t('profile')}</p>
      </div>

      <section className="profile-card">
        <div className="profile-avatar">
          {(firstName[0] ?? 'Г').toUpperCase()}
        </div>
        <div className="profile-identity">
          <h1>{firstName}</h1>
          <span>{username}</span>
        </div>
      </section>

      <section className="profile-stats">
        <Stat icon={IconFlame} value={loading ? '…' : stats.currentDays} label={t('profileCurrentDays')} />
        <Stat icon={IconTrophy} value={loading ? '…' : stats.bestRecord} label={t('profileBestRecord')} />
        <Stat icon={IconCalendarCheck} value={loading ? '…' : '—'} label={t('profileCompleted')} />
        <Stat icon={IconTarget} value={loading ? '…' : stats.habitsCount} label={t('profileHabits')} />
      </section>

      <SectionTitle>{t('achievements')}</SectionTitle>
      <section className="achievements-grid">
        {achievements.map((item) => (
          <div className={`achievement ${item.unlocked ? 'unlocked' : ''}`} key={item.title}>
            <span className="achievement-icon">{item.icon}</span>
            <span>{item.title}</span>
          </div>
        ))}
      </section>

      <SectionTitle>{t('streakResources')}</SectionTitle>
      <section className="profile-resource">
        <div className="resource-icon"><IconSnowflake size={20} /></div>
        <div>
          <strong>{t('streakFreezes')}</strong>
          <span>{t('profileFreezeDescription')}</span>
        </div>
        <b>{freezes ?? '…'}</b>
      </section>
    </div>
  )
}

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="profile-stat">
      <Icon size={19} />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function SectionTitle({ children }) {
  return <p className="profile-section-title">{children}</p>
}
