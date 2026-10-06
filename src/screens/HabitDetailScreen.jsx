import { useEffect, useState } from 'react'
import { IconArrowLeft, IconFlame, IconCheck, IconClock, IconPencil, IconUserPlus } from '@tabler/icons-react'
import { api } from '../api.js'
import { shareLink } from '../telegram.js'
import MonthCalendar, { getCurrentMonthKey } from '../components/MonthCalendar.jsx'

export default function HabitDetailScreen({ habit, onBack, onUpdated, onEdit }) {
  const [checkedDates, setCheckedDates] = useState([])
  const [frozenDates, setFrozenDates] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)
  const [inviting, setInviting] = useState(false)

  async function handleInvite() {
    setInviting(true)
    try {
      const { link } = await api.getInviteLink(habit.id)
      await shareLink(link, `Присоединяйся к «${habit.title}» в Streakly!`)
    } catch (err) {
      alert(err.message)
    } finally {
      setInviting(false)
    }
  }

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

  // The browser timezone is the same IANA timezone sent to the API in X-Timezone.
  // Keep the UI's "today" calculation in that same local timezone instead of
  // relying on the server's timezone.
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
        {habit.type === 'duo' && (
          <button onClick={handleInvite} disabled={inviting} style={{ background: 'none', border: 'none', padding: 0, display: 'flex' }}>
            <IconUserPlus size={18} color="var(--text-secondary)" />
          </button>
        )}
        {onEdit && (
          <button onClick={() => onEdit(habit)} style={{ background: 'none', border: 'none', padding: 0, display: 'flex' }}>
            <IconPencil size={18} color="var(--text-secondary)" />
          </button>
        )}
      </div>

      <div
        style={{
          background: 'var(--surface)',
          border: '2px solid var(--border)',
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
            background: `conic-gradient(var(--primary) ${progress * 3.6}deg, var(--border) 0deg)`,
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
              background: 'var(--surface)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconFlame size={26} color="var(--primary)" />
            <p style={{ fontSize: 30, fontWeight: 500, margin: '2px 0 0', color: 'var(--text)', lineHeight: 1 }}>
              {currentDays}
            </p>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
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
              <PersonStatus key={m.id} label={m.name} done={m.done} avatarUrl={m.avatarUrl} />
            ))}
          </div>
          {habit.breakRule === 'personal' && (
            <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 8px', fontWeight: 700 }}>
                Личные стрики и XP
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[...members].sort((a, b) => (Number(b.xp) || 0) - (Number(a.xp) || 0)).map((m, index) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <span style={{ width: 16, color: 'var(--text-secondary)', fontWeight: 700 }}>{index + 1}</span>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', background: 'var(--duo-bg)', display: 'grid', placeItems: 'center', color: 'var(--duo-icon)', fontWeight: 800 }}>
                      {m.avatarUrl ? <img src={m.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : String(m.name ?? '?').trim().slice(0, 1).toUpperCase()}
                    </div>
                    <span style={{ flex: 1, fontWeight: 600 }}>{m.name}</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>🔥 {m.streakDays ?? 0}</span>
                    <span style={{ color: 'var(--team-icon)', fontWeight: 800 }}>⭐ {m.xp ?? 0} XP</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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

function PersonStatus({ label, done, avatarUrl }) {
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
          overflow: 'hidden',
        }}
      >
        {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : label[0]}
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
