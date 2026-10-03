import { IconCheck, IconSnowflake } from '@tabler/icons-react'

const WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

function localDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getCurrentMonthKey() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export default function MonthCalendar({ checkedDates = [], frozenDates = [] }) {
  const checked = new Set(checkedDates)
  const frozen = new Set(frozenDates)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const year = today.getFullYear()
  const month = today.getMonth()

  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const leadingEmpty = firstDay.getDay()

  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, month, index + 1)
    date.setHours(0, 0, 0, 0)

    const key = localDateKey(date)
    const done = checked.has(key)
    const frozenDay = frozen.has(key)

    return {
      key,
      day: index + 1,
      done,
      frozen: frozenDay,
      isToday: key === localDateKey(today),
      isFuture: date > today,
    }
  })

  const monthTitle = today.toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="month-calendar">
      <div className="month-calendar-header">
        <span>{monthTitle}</span>
      </div>

      <div className="month-calendar-grid">
        {WEEKDAYS.map((weekday) => (
          <div className="month-weekday" key={weekday}>
            {weekday}
          </div>
        ))}

        {Array.from({ length: leadingEmpty }).map((_, index) => (
          <div className="month-day empty" key={`empty-${index}`} />
        ))}

        {days.map((item) => {
          const status = item.done
            ? 'done'
            : item.frozen
              ? 'frozen'
              : item.isFuture
                ? 'future'
                : 'missed'

          return (
            <div
              className={`month-day ${status} ${item.isToday ? 'today' : ''}`}
              key={item.key}
              title={
                item.done
                  ? 'Выполнено'
                  : item.frozen
                    ? 'Заморозка'
                    : item.isFuture
                      ? 'Предстоящий день'
                      : 'Не выполнено'
              }
            >
              {item.done ? (
                <IconCheck size={15} strokeWidth={3} />
              ) : item.frozen ? (
                <IconSnowflake size={14} strokeWidth={2.5} />
              ) : (
                item.day
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
