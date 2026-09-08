import { IconArrowLeft, IconFlame, IconCheck, IconClock } from '@tabler/icons-react'

// Placeholder calendar data for the month - true/false/null (null = future day)
const days = [
  true, true, true, true, true, false, null,
  true, true, true, true, true, null, null,
  true, true, null, null, null, null, null,
]
const weekLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export default function HabitDetailScreen({ habit, onBack }) {
  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', padding: 0, display: 'flex' }}
        >
          <IconArrowLeft size={20} color="var(--text-secondary)" />
        </button>
        <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>{habit.title}</p>
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
          дней подряд · рекорд {habit.record ?? habit.days + 7}
        </p>
      </div>

      {habit.partner && (
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
            <PersonStatus label="Ты" color="var(--team-icon)" done />
            <PersonStatus label={habit.partner} color="var(--duo-icon)" done={false} />
          </div>
        </div>
      )}

      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 8px', fontWeight: 500 }}>
        Этот месяц
      </p>
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, textAlign: 'center' }}>
          {weekLabels.map((d) => (
            <span key={d} style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{d}</span>
          ))}
          {days.map((done, i) => (
            <div
              key={i}
              style={{
                aspectRatio: '1',
                borderRadius: 8,
                background: done === true ? 'var(--duo-border)' : done === false ? 'var(--danger-bg)' : 'transparent',
                border: done === false ? '2px solid var(--danger-border)' : done === null ? '2px dashed var(--border)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {done === true && <IconFlame size={12} color="var(--duo-fg)" />}
            </div>
          ))}
        </div>
      </div>

      <button
        style={{
          width: '100%',
          background: 'var(--primary)',
          color: 'var(--primary-text)',
          border: 'none',
          borderRadius: 16,
          fontWeight: 500,
          padding: 12,
        }}
      >
        Отметить сегодня
      </button>
    </div>
  )
}

function PersonStatus({ label, color, done }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: color,
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
