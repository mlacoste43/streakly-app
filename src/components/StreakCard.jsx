import { useSettings } from '../context/SettingsContext.jsx'
import WeekCalendar from './WeekCalendar.jsx'

// `variant` picks the color pair from index.css: 'solo' | 'duo' | 'team' | 'danger'
// needsCheckIn = the streak is at risk today -> show the check-in button
export default function StreakCard({
  icon: Icon,
  title,
  subtitle,
  days,
  record,
  variant = 'solo',
  needsCheckIn = false,
  people = [],
  memberStatus = [],
  onCheckIn,
  onOpen,
  checkedDates = [],
  frozenDates = [],
  xp = 0,
  personalRule = false,
}) {
  const { t } = useSettings()
  const best = Math.max(record ?? 0, days)
  const pct = best > 0 ? Math.min(100, (days / best) * 100) : 0

  return (
    <article
      className="card-ng streak-card"
      onClick={onOpen}
      style={{ cursor: onOpen ? 'pointer' : 'default' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 54, height: 54, borderRadius: 17, flexShrink: 0,
            background: `var(--${variant}-bg)`,
            display: 'grid', placeItems: 'center',
          }}
        >
          <Icon size={28} color={`var(--${variant}-icon)`} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 17, lineHeight: 1.3, margin: '0 0 2px', overflowWrap: 'anywhere' }}>
            {title}
          </h3>
          <span
            style={{
              fontSize: 12,
              color: needsCheckIn ? 'var(--danger-icon)' : 'var(--text-secondary)',
              fontWeight: needsCheckIn ? 700 : 400,
            }}
          >
            {subtitle}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
          <div className="streak-pill" title={t('streak')}>🔥 {days}</div>
          {personalRule && <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--team-icon)' }}>⭐ {xp} XP</span>}
        </div>
      </div>

      <div
        style={{
          display: 'flex', justifyContent: 'space-between', gap: 12,
          margin: '16px 0 8px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700,
        }}
      >
        <span>{t('streakToRecord')}</span>
        <span>{days} / {best}</span>
      </div>
      <div
        className="track"
        role="progressbar"
        aria-valuenow={days}
        aria-valuemin={0}
        aria-valuemax={best}
      >
        <div className="fill" style={{ width: `${pct}%` }} />
      </div>

      <WeekCalendar checkedDates={checkedDates} frozenDates={frozenDates} compact />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 16 }}>
        <div className="habit-participants" aria-label="Участники привычки">
          {(memberStatus.length ? memberStatus : people.map((name, i) => ({ id: i, name, done: false })))
            .slice(0, 4)
            .map((p, i) => {
              const name = p?.name ?? 'Участник'
              const initials = String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
              return (
                <span key={p.id ?? `${name}-${i}`} className="person" title={name} style={{ marginLeft: i ? -7 : 0, zIndex: 10 - i, background: `var(--avatar-${i % 5})` }}>
                  {p.avatarUrl ? <img src={p.avatarUrl} alt="" /> : initials || '?'}
                </span>
              )
            })}
          {memberStatus.length > 4 && <span className="person person-more">+{memberStatus.length - 4}</span>}
          {memberStatus.length > 0 && <span className="participants-count">{memberStatus.filter((p) => p.done).length}/{memberStatus.length}</span>}
        </div>

        {needsCheckIn ? (
          <button
            className="btn small"
            onClick={(e) => {
              e.stopPropagation()
              onCheckIn?.()
            }}
          >
            {t('checkInBtn')}
          </button>
        ) : (
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary-dark)' }}>
            {t('allGood')}
          </span>
        )}
      </div>
    </article>
  )
}
