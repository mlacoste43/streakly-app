import { IconFlame, IconSettings, IconPlus, IconRun, IconLanguage, IconBook, IconUsers } from '@tabler/icons-react'
import StreakCard from '../components/StreakCard.jsx'

// Placeholder data - will come from the backend once it exists.
const habits = [
  { id: 1, icon: IconRun, title: 'Утренняя зарядка', subtitle: 'Соло', days: 12, variant: 'solo' },
  { id: 2, icon: IconLanguage, title: 'Английский 15 мин', subtitle: 'Дуо с Аней', days: 34, variant: 'duo', partner: 'Аня' },
  { id: 3, icon: IconBook, title: 'Читать 20 страниц', subtitle: 'Соло · осталось 3 часа', days: 7, variant: 'danger', isOverdue: true },
  { id: 4, icon: IconUsers, title: 'Утренний забег', subtitle: 'Команда · 5 из 5 сегодня', days: 21, variant: 'team' },
]

export default function MainScreen({ onOpenHabit, onCreateHabit }) {
  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>Streakly</p>
        <IconSettings size={20} color="var(--text-secondary)" />
      </div>

      <div
        style={{
          background: 'var(--duo-icon)',
          borderRadius: 20,
          padding: '1.25rem 1rem',
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        <IconFlame size={40} color="#FAEEDA" />
        <p style={{ fontSize: 40, fontWeight: 500, margin: '4px 0 0', color: '#FAEEDA', lineHeight: 1 }}>12</p>
        <p style={{ fontSize: 13, color: '#F3D9AD', margin: '4px 0 0' }}>дней подряд без пропуска</p>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 8px', fontWeight: 500 }}>
        Твои привычки
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {habits.map((h) => (
          <StreakCard
            key={h.id}
            icon={h.icon}
            title={h.title}
            subtitle={h.subtitle}
            days={h.days}
            variant={h.variant}
            isOverdue={h.isOverdue}
            onCheckIn={() => alert(`Отметил: ${h.title}`)}
            onOpen={() => onOpenHabit?.(h)}
          />
        ))}
      </div>

      <button
        onClick={onCreateHabit}
        style={{
          width: '100%',
          marginTop: 16,
          background: 'var(--primary)',
          color: 'var(--primary-text)',
          border: 'none',
          borderRadius: 16,
          fontWeight: 500,
          padding: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <IconPlus size={18} />
        Новая привычка
      </button>
    </div>
  )
}
