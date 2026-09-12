// No database yet - this is a plain in-memory store so the API has
// something real to serve. Everything resets when the server restarts.
// Swap this file for real DB queries later without touching the routes much.

let nextId = 5

export const habits = [
  { id: 1, ownerId: 1, title: 'Утренняя зарядка', icon: 'run', variant: 'solo', type: 'solo', days: 12, record: 19, checkIns: {} },
  { id: 2, ownerId: 1, title: 'Английский 15 мин', icon: 'language', variant: 'duo', type: 'duo', days: 34, record: 41, partner: 'Аня', checkIns: {} },
  { id: 3, ownerId: 1, title: 'Читать 20 страниц', icon: 'book', variant: 'solo', type: 'solo', days: 7, record: 15, deadlineHours: 3, checkIns: {} },
  { id: 4, ownerId: 1, title: 'Утренний забег', icon: 'users', variant: 'team', type: 'team', days: 21, record: 21, checkIns: {} },
]

export const teamMembers = {
  4: [
    { id: 1, name: 'Ты', done: true, time: '7:14' },
    { id: 2, name: 'Маша', done: true, time: '6:50' },
    { id: 3, name: 'Костя', done: true, time: '8:02' },
    { id: 4, name: 'Дима', done: false },
    { id: 5, name: 'Лена', done: true, time: '7:30' },
  ],
}

export function addHabit(data) {
  const habit = {
    id: nextId++,
    ownerId: 1,
    title: data.name,
    icon: 'flame',
    variant: data.type,
    type: data.type,
    frequency: data.frequency,
    breakRule: data.breakRule,
    days: 0,
    record: 0,
    checkIns: {},
  }
  habits.push(habit)
  return habit
}

export function findHabit(id) {
  return habits.find((h) => h.id === Number(id))
}

export function checkIn(id) {
  const habit = findHabit(id)
  if (!habit) return null
  const today = new Date().toISOString().slice(0, 10)
  if (!habit.checkIns[today]) {
    habit.checkIns[today] = true
    habit.days += 1
    habit.record = Math.max(habit.record, habit.days)
  }
  return habit
}
