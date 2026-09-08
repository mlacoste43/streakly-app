import { useState } from 'react'
import {
  IconX, IconUser, IconUsers, IconUsersGroup, IconClock, IconChevronRight,
  IconFlameOff, IconLanguage,
} from '@tabler/icons-react'

const TYPES = [
  { id: 'solo', label: 'Соло', icon: IconUser },
  { id: 'duo', label: 'Дуо', icon: IconUsers },
  { id: 'team', label: 'Команда', icon: IconUsersGroup },
]

const FREQUENCIES = [
  { id: 'daily', label: 'Каждый день' },
  { id: 'weekdays', label: 'Будни' },
  { id: 'weekly', label: 'N раз/нед' },
]

export default function CreateHabitScreen({ onBack, onCreate }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('solo')
  const [frequency, setFrequency] = useState('daily')
  const [breakRule, setBreakRule] = useState('all')

  function handleSubmit() {
    onCreate?.({ name, type, frequency, breakRule })
  }

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, display: 'flex' }}>
          <IconX size={20} color="var(--text-secondary)" />
        </button>
        <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Новая привычка</p>
        <span style={{ width: 20 }} />
      </div>

      <Field label="Название">
        <div
          style={{
            background: 'var(--surface)',
            border: '2px solid var(--duo-border)',
            borderRadius: 14,
            padding: '0.8rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 34, height: 34, borderRadius: 10, background: 'var(--duo-icon)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <IconLanguage size={18} color="var(--duo-bg)" />
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например, Английский 15 минут"
            style={{
              border: 'none', outline: 'none', background: 'none', fontSize: 14, flex: 1,
              color: 'var(--text)',
            }}
          />
        </div>
      </Field>

      <Field label="С кем держишь стрик">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {TYPES.map((t) => {
            const active = type === t.id
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                style={{
                  background: active ? 'var(--solo-bg)' : 'var(--surface)',
                  border: `2px solid ${active ? 'var(--solo-border)' : 'var(--border)'}`,
                  borderRadius: 14,
                  padding: '0.8rem 0.5rem',
                  textAlign: 'center',
                }}
              >
                <Icon size={22} color={active ? 'var(--solo-icon)' : 'var(--text-secondary)'} style={{ margin: '0 auto' }} />
                <p style={{ fontSize: 12, margin: '6px 0 0', fontWeight: 500, color: active ? 'var(--solo-fg)' : 'var(--text-secondary)' }}>
                  {t.label}
                </p>
              </button>
            )
          })}
        </div>
      </Field>

      <Field label="Периодичность">
        <div style={{ display: 'flex', gap: 8 }}>
          {FREQUENCIES.map((f) => {
            const active = frequency === f.id
            return (
              <button
                key={f.id}
                onClick={() => setFrequency(f.id)}
                style={{
                  flex: 1,
                  background: active ? 'var(--solo-bg)' : 'var(--surface)',
                  border: `2px solid ${active ? 'var(--solo-border)' : 'var(--border)'}`,
                  borderRadius: 14,
                  padding: '0.6rem',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: 13, margin: 0, fontWeight: 500, color: active ? 'var(--solo-fg)' : 'var(--text-secondary)' }}>
                  {f.label}
                </p>
              </button>
            )
          })}
        </div>
      </Field>

      <Field label="Дедлайн отметки">
        <div
          style={{
            background: 'var(--surface)', borderRadius: 14, padding: '0.8rem 1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconClock size={18} color="var(--text-secondary)" />
            <p style={{ fontSize: 14, margin: 0 }}>До 23:59 по твоему времени</p>
          </div>
          <IconChevronRight size={16} color="var(--text-secondary)" />
        </div>
      </Field>

      <div
        style={{
          background: 'var(--danger-bg)', border: '1.5px solid var(--danger-border)',
          borderRadius: 14, padding: '0.9rem 1rem', marginBottom: 20,
        }}
      >
        <p style={{ fontSize: 12, color: 'var(--danger-icon)', margin: '0 0 8px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
          <IconFlameOff size={13} /> Правило разрыва стрика
        </p>
        <RadioRow
          label="Пропустил один — стрик горит у всех"
          selected={breakRule === 'all'}
          onClick={() => setBreakRule('all')}
        />
        <RadioRow
          label="У каждого свой личный стрик, но все видят чужой"
          selected={breakRule === 'personal'}
          onClick={() => setBreakRule('personal')}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!name.trim()}
        style={{
          width: '100%',
          background: name.trim() ? 'var(--primary)' : 'var(--border)',
          color: name.trim() ? 'var(--primary-text)' : 'var(--text-secondary)',
          border: 'none',
          borderRadius: 16,
          fontWeight: 500,
          padding: 12,
        }}
      >
        Создать привычку
      </button>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 6px', fontWeight: 500 }}>{label}</p>
      {children}
    </div>
  )
}

function RadioRow({ label, selected, onClick }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
      <div
        style={{
          width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
          border: `2px solid var(--danger-icon)`,
          background: selected ? 'var(--danger-icon)' : 'transparent',
        }}
      />
      <p style={{ fontSize: 13, margin: 0, color: 'var(--danger-icon)', fontWeight: selected ? 500 : 400 }}>
        {label}
      </p>
    </div>
  )
}
