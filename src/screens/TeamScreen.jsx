import { useEffect, useState } from 'react'
import { IconArrowLeft, IconFlame, IconAlertTriangle, IconCheck, IconClock, IconPencil, IconUserPlus } from '@tabler/icons-react'
import { api } from '../api.js'
import { shareLink } from '../telegram.js'

export default function TeamScreen({ habit, onBack, onEdit }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    let cancelled = false
    api.getMembers(habit.id)
      .then((response) => !cancelled && setMembers(response.members ?? []))
      .catch(() => !cancelled && setMembers([]))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [habit.id])

  const doneCount = members.filter((m) => m.done).length
  const laggards = members.filter((m) => !m.done)
  const leaderboard = [...members].sort((a, b) => {
    if (habit.breakRule === 'personal') return (Number(b.xp) || 0) - (Number(a.xp) || 0)
    return String(a.name).localeCompare(String(b.name))
  })

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, display: 'flex' }}>
          <IconArrowLeft size={20} color="var(--text-secondary)" />
        </button>
        <p style={{ fontSize: 16, fontWeight: 500, margin: 0, flex: 1 }}>{habit?.title ?? 'Командная привычка'}</p>
        <button onClick={handleInvite} disabled={inviting} style={{ background: 'none', border: 'none', padding: 0, display: 'flex' }}>
          <IconUserPlus size={18} color="var(--text-secondary)" />
        </button>
        {onEdit && (
          <button onClick={() => onEdit(habit)} style={{ background: 'none', border: 'none', padding: 0, display: 'flex' }}>
            <IconPencil size={18} color="var(--text-secondary)" />
          </button>
        )}
      </div>

      <div style={{ background: 'var(--team-icon)', borderRadius: 20, padding: '1.25rem 1rem', marginBottom: 16, textAlign: 'center' }}>
        <IconFlame size={32} color="var(--team-bg)" style={{ margin: '0 auto' }} />
        <p style={{ fontSize: 34, fontWeight: 500, margin: '2px 0 0', color: 'var(--team-bg)', lineHeight: 1 }}>
          {habit?.days ?? 0}
        </p>
        <p style={{ fontSize: 13, color: '#F0C4AE', margin: '6px 0 0' }}>
          {habit?.breakRule === 'personal' ? 'у каждого свой стрик и XP' : 'общий стрик команды'}
        </p>
      </div>

      {laggards.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '2px solid var(--danger-border)', borderRadius: 16, padding: '0.9rem 1rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconAlertTriangle size={18} color="var(--danger-icon)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 12, margin: 0, color: 'var(--danger-icon)' }}>
            {laggards.map((l) => l.name).join(', ')} ещё не отметился — {habit?.breakRule === 'personal' ? 'его личный стрик под угрозой' : 'стрик команды под угрозой'}
          </p>
        </div>
      )}

      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 8px', fontWeight: 500 }}>
        Сегодня отметились {doneCount} из {members.length}
      </p>

      {loading ? <div className="card-ng status-card">Загрузка…</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {members.map((m) => (
            <div key={m.id} style={{ background: m.done ? 'var(--surface)' : 'var(--danger-bg)', border: m.done ? '1px solid var(--border)' : '1.5px solid var(--danger-border)', borderRadius: 12, padding: '0.7rem 0.9rem', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', background: 'var(--team-bg)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, color: 'var(--team-icon)', flexShrink: 0 }}>
                {m.avatarUrl ? <img src={m.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : String(m.name ?? '?').trim().slice(0, 1).toUpperCase()}
              </div>
              <p style={{ fontSize: 13, margin: 0, flex: 1, fontWeight: 500 }}>{m.name}</p>
              <span style={{ fontSize: 11, fontWeight: 700, color: m.done ? 'var(--primary)' : 'var(--danger-icon)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {m.done ? <IconCheck size={13} /> : <IconClock size={13} />}
                {m.done ? `Готово${m.time ? ` в ${m.time}` : ''}` : 'Не отметился'}
              </span>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 8px', fontWeight: 500 }}>
        {habit?.breakRule === 'personal' ? 'Личные стрики и XP' : 'Стрики участников'}
      </p>
      <div style={{ background: 'var(--surface)', border: '2px solid var(--duo-border)', borderRadius: 16, padding: '0.9rem 1rem', marginBottom: 16 }}>
        {leaderboard.map((m, i) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
            <span style={{ fontSize: 13, fontWeight: 700, width: 16 }}>{i + 1}</span>
            <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', background: 'var(--duo-bg)', display: 'grid', placeItems: 'center', color: 'var(--duo-icon)', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {m.avatarUrl ? <img src={m.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : String(m.name ?? '?').trim().slice(0, 1).toUpperCase()}
            </div>
            <p style={{ fontSize: 13, margin: 0, flex: 1, fontWeight: 500 }}>{m.name}</p>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>🔥 {habit?.breakRule === 'personal' ? (m.streakDays ?? 0) : (habit?.days ?? 0)}</span>
            {habit?.breakRule === 'personal' && <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--team-icon)' }}>⭐ {m.xp ?? 0} XP</span>}
          </div>
        ))}
      </div>

      {laggards.length > 0 && (
        <button style={{ width: '100%', background: 'var(--primary)', color: 'var(--primary-text)', border: 'none', borderRadius: 16, fontWeight: 500, padding: 12 }}>
          Позвать {laggards[0].name} отметиться
        </button>
      )}
    </div>
  )
}
