import { IconCheck, IconAlarm } from '@tabler/icons-react'

// `variant` picks the color pair from index.css: 'solo' | 'duo' | 'team' | 'danger'
export default function StreakCard({
  icon: Icon,
  title,
  subtitle,
  days,
  variant = 'solo',
  isOverdue = false,
  onCheckIn,
}) {
  return (
    <div
      className="streak-card"
      style={{
        background: `var(--${variant}-bg)`,
        border: `2px solid var(--${variant}-border)`,
        borderRadius: 16,
        padding: '0.9rem 1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            background: `var(--${variant}-icon)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={24} color={`var(--${variant}-bg)`} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 500, margin: 0, color: `var(--${variant}-fg)` }}>
            {title}
          </p>
          <span style={{ fontSize: 11, color: `var(--${variant}-icon)` }}>{subtitle}</span>
        </div>

        {!isOverdue && (
          <p style={{ fontSize: 20, fontWeight: 500, margin: 0, color: `var(--${variant}-icon)`, display: 'flex', alignItems: 'center', gap: 4 }}>
            🔥 {days}
          </p>
        )}
      </div>

      {isOverdue && (
        <button
          onClick={onCheckIn}
          style={{
            width: '100%',
            marginTop: 10,
            background: 'var(--danger-icon)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontWeight: 500,
            padding: 10,
          }}
        >
          Спасти стрик
        </button>
      )}
    </div>
  )
}
