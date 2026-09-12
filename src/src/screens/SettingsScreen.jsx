import { useState } from 'react'
import {
  IconArrowLeft, IconChevronRight, IconLanguage, IconMoon, IconBell, IconClock,
  IconUsers, IconWorld, IconSnowflake, IconLock, IconMessageCircle, IconInfoCircle,
} from '@tabler/icons-react'

export default function SettingsScreen({ onBack, user }) {
  const [darkTheme, setDarkTheme] = useState(false)
  const [deadlineReminder, setDeadlineReminder] = useState(true)
  const [partnerAlert, setPartnerAlert] = useState(true)

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, display: 'flex' }}>
          <IconArrowLeft size={20} color="var(--text-secondary)" />
        </button>
        <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Настройки</p>
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

      <SectionLabel>Вид</SectionLabel>
      <Group>
        <Row icon={IconLanguage} label="Язык" value="Русский" chevron />
        <Row
          icon={IconMoon}
          label="Тёмная тема"
          last
          toggle
          checked={darkTheme}
          onToggle={() => setDarkTheme((v) => !v)}
        />
      </Group>

      <SectionLabel>Уведомления</SectionLabel>
      <Group>
        <Row
          icon={IconBell}
          label="Напоминания о дедлайне"
          toggle
          checked={deadlineReminder}
          onToggle={() => setDeadlineReminder((v) => !v)}
        />
        <Row icon={IconClock} label="За сколько напоминать" value="3 часа" chevron />
        <Row
          icon={IconUsers}
          label="Партнёр/команда не отметились"
          toggle
          checked={partnerAlert}
          onToggle={() => setPartnerAlert((v) => !v)}
        />
        <Row icon={IconWorld} label="Часовой пояс" value="Europe/Moscow" chevron last />
      </Group>

      <SectionLabel>Стрики</SectionLabel>
      <div
        style={{
          background: 'var(--duo-bg)', border: '2px solid var(--duo-border)', borderRadius: 16,
          marginBottom: 16, overflow: 'hidden',
        }}
      >
        <div style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconSnowflake size={18} color="var(--duo-icon)" />
          <p style={{ fontSize: 14, margin: 0, flex: 1, color: 'var(--duo-fg)' }}>Заморозки стрика</p>
          <span style={{ fontSize: 13, color: 'var(--duo-icon)', fontWeight: 500 }}>2 доступно</span>
          <IconChevronRight size={16} color="var(--duo-icon)" />
        </div>
      </div>

      <SectionLabel>Приватность и поддержка</SectionLabel>
      <Group>
        <Row icon={IconLock} label="Кто видит мои стрики" value="Только участники" chevron />
        <Row icon={IconMessageCircle} label="Обратная связь" chevron />
        <Row icon={IconInfoCircle} label="О приложении" value="v1.0.0" last />
      </Group>

      <button
        style={{
          width: '100%', background: 'transparent', color: 'var(--danger-icon)',
          border: '2px solid var(--danger-border)', borderRadius: 16, fontWeight: 500, padding: 12,
        }}
      >
        Удалить аккаунт
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

function Row({ icon: Icon, label, value, chevron, toggle, checked, onToggle, last }) {
  return (
    <div
      onClick={toggle ? onToggle : undefined}
      style={{
        padding: '0.85rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderBottom: last ? 'none' : '1px solid var(--border)',
        cursor: toggle ? 'pointer' : 'default',
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
