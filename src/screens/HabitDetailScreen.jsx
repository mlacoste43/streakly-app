import { useEffect, useState } from 'react'
import { IconArrowLeft, IconFlame, IconCheck, IconClock, IconPencil } from '@tabler/icons-react'
import { api } from '../api.js'
import MonthCalendar, { getCurrentMonthKey } from '../components/MonthCalendar.jsx'

export default function HabitDetailScreen({ habit, onBack, onUpdated, onEdit }) {
  const [checkedDates, setCheckedDates] = useState([])
  const [frozenDates, setFrozenDates] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)

  const monthKey = getCurrentMonthKey()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      api.getCheckIns(habit.id, monthKey),
      habit.type === 'duo' ? api.getMembers(habit.id) : Promise.resolve({ members: [] }),
    ])
      .then(([checkinResponses, membersRes]) => {
        if (cancelled) return
        setCheckedDates([...new Set(checkinResponses?.dates ?? [])])
        setFrozenDates([...new Set(checkinResponses?.frozenDates ?? [])])
        setMembers(membersRes.members)
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [habit.id, monthKey])

  async function handleCheckIn() {
    setCheckingIn(true)
    try {
      const { habit: updated } = await api.checkIn(habit.id)
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      setCheckedDates((prev) => (prev.includes(todayStr) ? prev : [...prev, todayStr]))
      onUpdated?.(updated)
    } catch (err) {
      alert(err.message)
    } finally {
      setCheckingIn(false)
    }
  }

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const alreadyDoneToday = checkedDates.includes(todayStr)

  // Круг показывает прогресс текущего стрика относительно личного рекорда.
  // Например, 12 из 19 дней = примерно 63% заполнения круга.
  const currentDays = Math.max(0, Number(habit.days) || 0)
  const recordDays = Math.max(currentDays, Number(habit.record) || 0)
  const progress = recordDays > 0
    ? Math.min(100, Math.round((currentDays / recordDays) * 100))
    : 0

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, display: 'flex' }}>
          <IconArrowLeft size={20} color="var(--text-secondary)" />
        </button>
        <p style={{ fontSize: 16, fontWeight: 500, margin: 0, flex: 1 }}>{habit.title}</p>
        {onEdit && (
          <button onClick={() => onEdit(habit)} style={{ background: 'none', border: 'none', padding: 0, display: 'flex' }}>
            <IconPencil size={18} color="var(--text-secondary)" />
          </button>
        )}
      </div>

      <div
        style={{
          background: 'var(--duo-icon)',
          borderRadius: 20,
          padding: '1.5rem 1rem',
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: `conic-gradient(#FAEEDA ${progress * 3.6}deg, rgba(255,255,255,0.3) 0deg)`,
            margin: '0 auto 12px',
            display: 'grid',
            placeItems: 'center',
            transition: 'background 0.5s ease',
          }}
        >
          <div
            style={{
              width: 104,
              height: 104,
              borderRadius: '50%',
              background: 'var(--duo-icon)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconFlame size={26} color="#FAEEDA" />
            <p style={{ fontSize: 30, fontWeight: 500, margin: '2px 0 0', color: '#FAEEDA', lineHeight: 1 }}>
              {currentDays}
            </p>
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#F3D9AD', margin: 0 }}>
          дней подряд · рекорд {habit.record}
        </p>
      </div>

      {habit.type === 'duo' && members.length > 0 && (
        <div
          style={{
            background: 'var(--surface)',
            border: '2px solid var(--duo-border)',
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 8px', fontWeight: 500 }}>
            С кем держишь стрик
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {members.map((m) => (
              <PersonStatus key={m.id} label={m.name} done={m.done} />
            ))}
          </div>
        </div>
      )}

      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 8px', fontWeight: 500 }}>
        Этот месяц
      </p>
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '14px 12px', marginBottom: 16 }}>
        {loading ? (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Загрузка…</p>
        ) : (
          <MonthCalendar checkedDates={checkedDates} frozenDates={frozenDates} />
        )}
      </div>

      <button
        onClick={handleCheckIn}
        disabled={checkingIn || alreadyDoneToday}
        style={{
          width: '100%',
          background: alreadyDoneToday ? 'var(--border)' : 'var(--primary)',
          color: alreadyDoneToday ? 'var(--text-secondary)' : 'var(--primary-text)',
          border: 'none',
          borderRadius: 16,
          fontWeight: 500,
          padding: 12,
        }}
      >
        {alreadyDoneToday ? 'Сегодня уже отмечено' : checkingIn ? 'Отмечаем…' : 'Отметить сегодня'}
      </button>
    </div>
  )
}

function PersonStatus({ label, done }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: 'var(--team-icon)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 500,
          color: '#fff',
        }}
      >
        {label[0]}
      </div>
      <div>
        <p style={{ fontSize: 13, margin: 0, fontWeight: 500 }}>{label}</p>
        <p
          style={{
            fontSize: 11,
            margin: 0,
            color: done ? 'var(--primary)' : 'var(--danger-icon)',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          {done ? <IconCheck size={11} /> : <IconClock size={11} />}
          {done ? 'Сегодня готово' : 'Ещё не готово'}
        </p>
      </div>
    </div>
  )
}
