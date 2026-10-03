import { useEffect, useState } from 'react'
import {
  IconArrowLeft, IconChevronRight, IconLanguage, IconMoon, IconBell, IconClock,
  IconUsers, IconWorld, IconSnowflake, IconLock, IconMessageCircle, IconInfoCircle,
} from '@tabler/icons-react'
import { useSettings } from '../context/SettingsContext.jsx'
import { api } from '../api.js'

// The browser always knows this for sure - used as an immediate fallback
// while we wait for the backend to confirm what it has saved for the user.
const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

export default function SettingsScreen({ onBack, user }) {
  const {
    theme, toggleTheme,
    language, toggleLanguage,
    deadlineReminder, setDeadlineReminder,
    partnerAlert, setPartnerAlert,
    reminderLeadHours, setReminderLeadHours,
    t,
  } = useSettings()

  const [timezone, setTimezone] = useState(browserTimezone)
  const [streakFreezes, setStreakFreezes] = useState(null)
  const [showReminderPicker, setShowReminderPicker] = useState(false)
  const reminderOptions = [1, 2, 3, 6, 12, 24]

  useEffect(() => {
    // every request already sends X-Timezone (see src/api.js), so by the
    // time this loads the backend should have the up-to-date value saved
    api.getMe().then((res) => {
      if (res.user?.timezone) setTimezone(res.user.timezone)
      if (res.user?.streak_freezes != null) setStreakFreezes(res.user.streak_freezes)
    }).catch(() => {})
  }, [])

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, display: 'flex' }}>
          <IconArrowLeft size={20} color="var(--text-secondary)" />
        </button>
        <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>{t('settings')}</p>
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
        <Row
          icon={IconClock}
          label={t('reminderLeadTime')}
          value={`${reminderLeadHours} ч`}
          chevron
          onClick={() => setShowReminderPicker(true)}
        />
        <Row
          icon={IconUsers}
          label={t('partnerAlert')}
          toggle
          checked={partnerAlert}
          onToggle={() => setPartnerAlert(!partnerAlert)}
        />
        <Row icon={IconWorld} label={t('timezone')} value={timezone} last />
      </Group>

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

      {showReminderPicker && (
        <div
          onClick={() => setShowReminderPicker(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              background: 'var(--surface)',
              borderRadius: '20px 20px 0 0',
              padding: '18px 16px 24px',
              boxSizing: 'border-box',
              boxShadow: '0 -8px 30px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{
              textAlign: 'center',
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 14,
            }}>
              {t('reminderLeadTime')}
            </div>

            {reminderOptions.map((hours) => (
              <button
                key={hours}
                type="button"
                onClick={() => {
                  setReminderLeadHours(hours)
                  setShowReminderPicker(false)
                }}
                style={{
                  width: '100%',
                  padding: '13px 12px',
                  border: 'none',
                  borderRadius: 12,
                  background: hours === reminderLeadHours
                    ? 'var(--primary-soft, rgba(46, 160, 67, 0.12))'
                    : 'transparent',
                  color: 'var(--text)',
                  fontSize: 15,
                  textAlign: 'left',
                  cursor: 'pointer',
                  marginBottom: 4,
                }}
              >
                {hours} {hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}
                {hours === reminderLeadHours && (
                  <span style={{ float: 'right', color: 'var(--primary)' }}>✓</span>
                )}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setShowReminderPicker(false)}
              style={{
                width: '100%',
                marginTop: 8,
                padding: 13,
                border: '1px solid var(--border)',
                borderRadius: 12,
                background: 'transparent',
                color: 'var(--text)',
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
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
