import { useEffect, useState } from 'react'
import { IconFlame, IconSettings, IconPlus, IconRun, IconLanguage, IconBook, IconUsers } from '@tabler/icons-react'
import StreakCard from '../components/StreakCard.jsx'
import { api } from '../api.js'

// Backend sends the icon as a string (see server/src/data/store.js) - map it to a real icon here.
const ICONS = { run: IconRun, language: IconLanguage, book: IconBook, users: IconUsers }

function subtitleFor(habit) {
  if (habit.type === 'duo') return `Дуо с ${habit.partner ?? '...'}`
  if (habit.type === 'team') return 'Команда'
  if (habit.deadlineHours) return `Соло · осталось ${habit.deadlineHours} ч`
  return 'Соло'
}

export default function MainScreen({ onOpenHabit, onCreateHabit, onOpenSettings }) {
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

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>Streakly</p>
        <IconSettings
          size={20}
          color="var(--text-secondary)"
          onClick={onOpenSettings}
          style={{ cursor: 'pointer' }}
        />
      </div>

      <div
        style={{
          background: 'var(--duo-icon)',
          borderRadius: 20,
          padding: '1.25rem 1rem',
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        <IconFlame size={40} color="#FAEEDA" />
        <p style={{ fontSize: 40, fontWeight: 500, margin: '4px 0 0', color: '#FAEEDA', lineHeight: 1 }}>
          {habits.reduce((sum, h) => sum + h.days, 0)}
        </p>
        <p style={{ fontSize: 13, color: '#F3D9AD', margin: '4px 0 0' }}>суммарных дней огня</p>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 8px', fontWeight: 500 }}>
        Твои привычки
      </p>

      {loading && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Загрузка…</p>}
      {error && <p style={{ fontSize: 13, color: 'var(--danger-icon)' }}>Не удалось загрузить: {error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {habits.map((h) => (
          <StreakCard
            key={h.id}
            icon={ICONS[h.icon] ?? IconFlame}
            title={h.title}
            subtitle={subtitleFor(h)}
            days={h.days}
            variant={h.variant}
            isOverdue={Boolean(h.deadlineHours)}
            onCheckIn={() => handleCheckIn(h)}
            onOpen={() => onOpenHabit?.(h)}
          />
        ))}
      </div>

      <button
        onClick={onCreateHabit}
        style={{
          width: '100%',
          marginTop: 16,
          background: 'var(--primary)',
          color: 'var(--primary-text)',
          border: 'none',
          borderRadius: 16,
          fontWeight: 500,
          padding: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <IconPlus size={18} />
        Новая привычка
      </button>
    </div>
  )
}
