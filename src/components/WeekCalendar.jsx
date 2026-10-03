import { IconCheck, IconSnowflake } from '@tabler/icons-react'

const WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

function localDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function startOfWeek(date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  result.setDate(result.getDate() - result.getDay())
  return result
}

export function getCurrentWeekDays() {
  const start = startOfWeek(new Date())

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return {
      key: localDateKey(date),
      day: date.getDate(),
      weekday: WEEKDAYS[date.getDay()],
      isToday: localDateKey(date) === localDateKey(new Date()),
      isFuture: date > new Date(),
    }
  })
}

export function getCurrentWeekMonthKeys() {
  const days = getCurrentWeekDays()
  return [...new Set(days.map((item) => item.key.slice(0, 7)))].sort()
}

export default function WeekCalendar({ checkedDates = [], frozenDates = [], compact = false }) {
  const checked = new Set(checkedDates)
  const frozen = new Set(frozenDates)
  const days = getCurrentWeekDays()

  return (
    <div className={`week-calendar ${compact ? 'week-calendar-compact' : ''}`}>
      {days.map((item) => {
        const done = checked.has(item.key)
        const frozenDay = frozen.has(item.key)
        const status = done ? 'done' : frozenDay ? 'frozen' : item.isFuture ? 'future' : 'missed'

        return (
          <div className="week-day" key={item.key}>
            <span className="week-day-label">{item.weekday}</span>
            <div
              className={`week-day-box ${status} ${item.isToday ? 'today' : ''}`}
              title={
                done ? 'Выполнено' :
                frozenDay ? 'Заморозка' :
                item.isFuture ? 'Предстоящий день' :
                'Не выполнено'
              }
            >
              {done ? <IconCheck size={15} strokeWidth={3} /> : null}
              {frozenDay && !done ? <IconSnowflake size={14} strokeWidth={2.5} /> : null}
              {!done && !frozenDay ? item.day : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
