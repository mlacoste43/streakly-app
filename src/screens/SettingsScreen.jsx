import {
  IconArrowLeft, IconChevronRight, IconLanguage, IconMoon, IconBell, IconClock,
  IconUsers, IconWorld, IconSnowflake, IconLock, IconMessageCircle, IconInfoCircle,
} from '@tabler/icons-react'
import { useSettings } from '../context/SettingsContext.jsx'

export default function SettingsScreen({ onBack, user }) {
  const {
    theme, toggleTheme,
    language, toggleLanguage,
    deadlineReminder, setDeadlineReminder,
    partnerAlert, setPartnerAlert,
    reminderLeadHours,
    t,
  } = useSettings()

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, display: 'flex' }}>
          <IconArrowLeft size={20} color="var(--text-secondary)" />
        </button>
        <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>{t('settings')}</p>
      </div>

      <div
        style={{
          background: 'var(--surface)', borderRadius: 16, padding: 16, marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            width: 48, height: 48, borderRadius: '50%', background: 'var(--team-icon)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 500, color: '#fff', flexShrink: 0,
          }}
        >
          {(user?.first_name ?? 'Т')[0]}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{user?.first_name ?? 'Тимофей'}</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
            @{user?.username ?? 'timofey_streaks'}
          </p>
        </div>
        <IconChevronRight size={16} color="var(--text-secondary)" />
      </div>

      <SectionLabel>{t('view')}</SectionLabel>
      <Group>
        <Row
          icon={IconLanguage}
          label={t('language')}
          value={language === 'ru' ? 'Русский' : 'English'}
          onClick={toggleLanguage}
          chevron
        />
        <Row
          icon={IconMoon}
          label={t('darkTheme')}
          last
          toggle
          checked={theme === 'dark'}
          onToggle={toggleTheme}
        />
      </Group>

      <SectionLabel>{t('notifications')}</SectionLabel>
      <Group>
        <Row
          icon={IconBell}
          label={t('deadlineReminder')}
          toggle
          checked={deadlineReminder}
          onToggle={() => setDeadlineReminder(!deadlineReminder)}
        />
        <Row icon={IconClock} label={t('reminderLeadTime')} value={`${reminderLeadHours} ч`} chevron />
        <Row
          icon={IconUsers}
          label={t('partnerAlert')}
          toggle
          checked={partnerAlert}
          onToggle={() => setPartnerAlert(!partnerAlert)}
        />
        <Row icon={IconWorld} label={t('timezone')} value="Europe/Moscow" chevron last />
      </Group>

      <SectionLabel>{t('streaks')}</SectionLabel>
      <div
        style={{
          background: 'var(--duo-bg)', border: '2px solid var(--duo-border)', borderRadius: 16,
          marginBottom: 16, overflow: 'hidden',
        }}
      >
        <div style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconSnowflake size={18} color="var(--duo-icon)" />
          <p style={{ fontSize: 14, margin: 0, flex: 1, color: 'var(--duo-fg)' }}>{t('streakFreezes')}</p>
          <span style={{ fontSize: 13, color: 'var(--duo-icon)', fontWeight: 500 }}>2 {t('available')}</span>
          <IconChevronRight size={16} color="var(--duo-icon)" />
        </div>
      </div>

      <SectionLabel>{t('privacySupport')}</SectionLabel>
      <Group>
        <Row icon={IconLock} label={t('whoSeesStreaks')} value={t('onlyMembers')} chevron />
        <Row icon={IconMessageCircle} label={t('feedback')} chevron />
        <Row icon={IconInfoCircle} label={t('about')} value="v1.0.0" last />
      </Group>

      <button
        style={{
          width: '100%', background: 'transparent', color: 'var(--danger-icon)',
          border: '2px solid var(--danger-border)', borderRadius: 16, fontWeight: 500, padding: 12,
        }}
      >
        {t('deleteAccount')}
      </button>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 6px', fontWeight: 500 }}>
      {children}
    </p>
  )
}

function Group({ children }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, marginBottom: 16, overflow: 'hidden' }}>
      {children}
    </div>
  )
}

function Row({ icon: Icon, label, value, chevron, toggle, checked, onToggle, onClick, last }) {
  return (
    <div
      onClick={toggle ? onToggle : onClick}
      style={{
        padding: '0.85rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderBottom: last ? 'none' : '1px solid var(--border)',
        cursor: toggle || onClick ? 'pointer' : 'default',
      }}
    >
      <Icon size={18} color="var(--text-secondary)" />
      <p style={{ fontSize: 14, margin: 0, flex: 1 }}>{label}</p>
      {value && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{value}</span>}
      {chevron && <IconChevronRight size={16} color="var(--text-secondary)" />}
      {toggle && (
        <div
          style={{
            width: 40, height: 24, borderRadius: 12, flexShrink: 0, position: 'relative',
            background: checked ? 'var(--primary)' : 'var(--border)',
            transition: 'background 0.15s',
          }}
        >
          <div
            style={{
              width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute',
              top: 3, left: checked ? 19 : 3, transition: 'left 0.15s',
            }}
          />
        </div>
      )}
    </div>
  )
}
