import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import { getCurrentWeekMonthKeys } from '../components/WeekCalendar.jsx'
export function localDay() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}
async function mapLimit(items, fn) {
  const result = new Array(items.length)
  let index = 0
  await Promise.all(Array.from({ length: Math.min(4, items.length) }, async () => {
    while (index < items.length) {
      const i = index++
      result[i] = await fn(items[i])
    }
  }))
  return result
}
export function useDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(null)
  const [message, setMessage] = useState('')
  const [celebration, setCelebration] = useState(0)
  const [day, setDay] = useState(localDay)
  const alive = useRef(false)
  const busy = useRef(false)
  const fetching = useRef(false)
  const sequence = useRef(0)
  const load = useCallback(async () => {
    if (fetching.current || busy.current) return
    fetching.current = true
    const seq = ++sequence.current
    setLoading(true)
    setError('')
    try {
      const { habits = [] } = await api.getHabits()
      const [me, progress, calendars] = await Promise.all([
        api.getMe().catch(() => null),
        api.getProgress().catch(() => null),
        mapLimit(habits, async h => {
          try {
            const months = await Promise.all(getCurrentWeekMonthKeys().map(m => api.getCheckIns(h.id, m)))
            const members = h.type === 'solo' ? [] : await api.getMembers(h.id).then(r => r.members ?? []).catch(() => null)
            return [h.id, { ready: true, members, dates: [...new Set(months.flatMap(r => r.dates ?? []))], frozenDates: [...new Set(months.flatMap(r => r.frozenDates ?? []))] }]
          } catch { return [h.id, { ready: false, dates: [], frozenDates: [], members: null }] }
        }),
      ])
      if (alive.current && seq === sequence.current) setData({ habits, user: me?.user, stats: progress?.stats, calendars: Object.fromEntries(calendars) })
    } catch (err) {
      if (alive.current) setError(err.message || 'Не удалось загрузить привычки')
    } finally {
      fetching.current = false
      if (alive.current) setLoading(false)
    }
  }, [])
  useEffect(() => {
    alive.current = true
    const tick = () => {
      if (document.visibilityState !== 'visible' || busy.current || fetching.current) return
      setDay(localDay())
      load()
    }
    load()
    const timer = setInterval(tick, 60000)
    document.addEventListener('visibilitychange', tick)
    return () => { alive.current = false; clearInterval(timer); document.removeEventListener('visibilitychange', tick) }
  }, [load])
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(''), 5000)
    return () => clearTimeout(timer)
  }, [message, celebration])
  async function check(habit) {
    const cal = data?.calendars[habit.id]
    if (busy.current || fetching.current || !cal?.ready || cal.dates.includes(localDay())) return
    busy.current = true
    setPending(habit.id)
    setMessage('')
    let saved = false
    try {
      const { habit: updated } = await api.checkIn(habit.id)
      saved = true
      if (!alive.current) return
      const today = localDay()
      setDay(today)
      setData(prev => ({ ...prev, habits: prev.habits.map(h => h.id === habit.id ? { ...h, ...updated } : h), calendars: { ...prev.calendars, [habit.id]: { ...prev.calendars[habit.id], dates: [...new Set([...prev.calendars[habit.id].dates, today])] } } }))
      setCelebration(v => v + 1)
      setMessage('Готово! Ещё один шаг для себя.')
    } catch (err) {
      if (alive.current) {
        setData(prev => ({ ...prev, calendars: { ...prev.calendars, [habit.id]: { ...prev.calendars[habit.id], ready: false } } }))
        setMessage('Не удалось подтвердить отметку. Обновляем данные перед повтором. ' + err.message)
      }
    } finally {
      busy.current = false
      if (alive.current) { setPending(null); await load() }
    }
    return saved
  }
  return { data, error, loading, pending, message, celebration, day, load, check }
}
