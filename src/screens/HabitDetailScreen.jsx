import { useEffect, useState } from 'react'
import { IconArrowLeft, IconFlame, IconCheck, IconClock, IconPencil } from '@tabler/icons-react'
import { api } from '../api.js'

const weekLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

// Builds a Mon-first calendar grid for the given month, marking each day
// as done / missed / future based on real check-in dates from the API.
function buildMonthGrid(year, month, checkedDates) {
  const checkedSet = new Set(checkedDates)
  const firstOfMonth = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  // JS getDay(): 0=Sun..6=Sat -> convert to Mon-first (0=Mon..6=Sun)
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7

  const todayStr = new Date().toISOString().slice(0, 10)

  const cells = []
  for (let i = 0; i < leadingBlanks; i++) cells.push(null)

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    let status
    if (dateStr > todayStr) status = 'future'
    else if (checkedSet.has(dateStr)) status = 'done'
    else status = 'missed'
    cells.push({ day, status })
  }

  return cells
}

export default function HabitDetailScreen({ habit, onBack, onUpdated, onEdit }) {
  const [checkedDates, setCheckedDates] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthKey = `${year}-${month}`
  const grid = buildMonthGrid(year, month, checkedDates)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      api.getCheckIns(habit.id, monthKey),
      habit.type === 'duo' ? api.getMembers(habit.id) : Promise.resolve({ members: [] }),
    ])
      .then(([checkinsRes, membersRes]) => {
        if (cancelled) return
        setCheckedDates(checkinsRes.dates)
        setMembers(membersRes.members)
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [habit.id])

  async function handleCheckIn() {
    setCheckingIn(true)
    try {
      const { habit: updated } = await api.checkIn(habit.id)
      const todayStr = new Date().toISOString().slice(0, 10)
      setCheckedDates((prev) => (prev.includes(todayStr) ? prev : [...prev, todayStr]))
      onUpdated?.(updated)
    } catch (err) {
      alert(err.message)
    } finally {
      setCheckingIn(false)
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10)
  const alreadyDoneToday = checkedDates.includes(todayStr)

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
            border: '8px solid rgba(255,255,255,0.3)',
            margin: '0 auto 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div>
            <IconFlame size={26} color="#FAEEDA" style={{ margin: '0 auto' }} />
            <p style={{ fontSize: 30, fontWeight: 500, margin: '2px 0 0', color: '#FAEEDA', lineHeight: 1 }}>
              {habit.days}
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
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
        {loading ? (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Загрузка…</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, textAlign: 'center' }}>
            {weekLabels.map((d) => (
              <span key={d} style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{d}</span>
            ))}
            {grid.map((cell, i) => {
              if (!cell) return <div key={i} />
              const { status } = cell
              return (
                <div
                  key={i}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 8,
                    background: status === 'done' ? 'var(--duo-border)' : status === 'missed' ? 'var(--danger-bg)' : 'transparent',
                    border: status === 'missed' ? '2px solid var(--danger-border)' : status === 'future' ? '2px dashed var(--border)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {status === 'done' && <IconFlame size={12} color="var(--duo-fg)" />}
                </div>
              )
            })}
          </div>
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
