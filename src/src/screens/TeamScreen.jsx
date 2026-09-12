import { IconArrowLeft, IconFlame, IconAlertTriangle, IconCheck, IconClock } from '@tabler/icons-react'

// Placeholder data - will come from the backend once it exists.
const members = [
  { id: 1, name: 'Ты', color: 'var(--team-icon)', done: true, time: '7:14' },
  { id: 2, name: 'Маша', color: '#D85A30', done: true, time: '6:50' },
  { id: 3, name: 'Костя', color: 'var(--team-icon)', done: true, time: '8:02' },
  { id: 4, name: 'Дима', color: '#B8442E', done: false },
  { id: 5, name: 'Лена', color: '#F5B896', done: true, time: '7:30' },
]

const leaderboard = [
  { id: 2, name: 'Маша', color: '#D85A30', days: 58 },
  { id: 1, name: 'Ты', color: 'var(--team-icon)', days: 21 },
  { id: 5, name: 'Лена', color: '#F5B896', days: 19 },
]

export default function TeamScreen({ habit, onBack }) {
  const doneCount = members.filter((m) => m.done).length
  const laggards = members.filter((m) => !m.done)

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, display: 'flex' }}>
          <IconArrowLeft size={20} color="var(--text-secondary)" />
        </button>
        <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>{habit?.title ?? 'Утренний забег'}</p>
      </div>

      <div style={{ background: 'var(--team-icon)', borderRadius: 20, padding: '1.25rem 1rem', marginBottom: 16, textAlign: 'center' }}>
        <IconFlame size={32} color="var(--team-bg)" style={{ margin: '0 auto' }} />
        <p style={{ fontSize: 34, fontWeight: 500, margin: '2px 0 0', color: 'var(--team-bg)', lineHeight: 1 }}>
          {habit?.days ?? 21}
        </p>
        <p style={{ fontSize: 13, color: '#F0C4AE', margin: '6px 0 0' }}>
          общий стрик команды — держит только тот, кто держит слабее всех
        </p>
      </div>

      {laggards.length > 0 && (
        <div
          style={{
            background: 'var(--surface)', border: '2px solid var(--danger-border)', borderRadius: 16,
            padding: '0.9rem 1rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <IconAlertTriangle size={18} color="var(--danger-icon)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 12, margin: 0, color: 'var(--danger-icon)' }}>
            {laggards.map((l) => l.name).join(', ')} ещё не отметил{laggards.length === 1 ? 'ся' : 'ись'} — стрик
            команды сгорит через 2 часа, если не успе{laggards.length === 1 ? 'ет' : 'ют'}
          </p>
        </div>
      )}

      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 8px', fontWeight: 500 }}>
        Сегодня отметились {doneCount} из {members.length}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {members.map((m) => (
          <div
            key={m.id}
            style={{
              background: m.done ? 'var(--surface)' : 'var(--danger-bg)',
              border: m.done ? '1px solid var(--border)' : '1.5px solid var(--danger-border)',
              borderRadius: 12,
              padding: '0.7rem 0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32, height: 32, borderRadius: '50%', background: m.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 500, color: '#fff', flexShrink: 0,
              }}
            >
              {m.name[0]}
            </div>
            <p style={{ fontSize: 13, margin: 0, flex: 1, fontWeight: 500, color: m.done ? 'var(--text)' : 'var(--danger-icon)' }}>
              {m.name}
            </p>
            <span
              style={{
                fontSize: 11, fontWeight: 500,
                color: m.done ? 'var(--primary)' : 'var(--danger-icon)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              {m.done ? <IconCheck size={13} /> : <IconClock size={13} />}
              {m.done ? `Готово в ${m.time}` : 'Не отметился'}
            </span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 8px', fontWeight: 500 }}>
        Лидерборд по личным стрикам
      </p>
      <div style={{ background: 'var(--surface)', border: '2px solid #D85A30', borderRadius: 16, padding: '0.9rem 1rem', marginBottom: 16 }}>
        {leaderboard.map((m, i) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
            <span style={{ fontSize: 13, fontWeight: 500, width: 16 }}>{i + 1}</span>
            <div
              style={{
                width: 26, height: 26, borderRadius: '50%', background: m.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, color: '#fff', flexShrink: 0,
              }}
            >
              {m.name[0]}
            </div>
            <p style={{ fontSize: 13, margin: 0, flex: 1, fontWeight: m.name === 'Ты' ? 500 : 400 }}>{m.name}</p>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--team-icon)' }}>{m.days} дн</span>
          </div>
        ))}
      </div>

      {laggards.length > 0 && (
        <button
          style={{
            width: '100%', background: 'var(--primary)', color: 'var(--primary-text)',
            border: 'none', borderRadius: 16, fontWeight: 500, padding: 12,
          }}
        >
          Позвать {laggards[0].name} отметиться
        </button>
      )}
    </div>
  )
}
