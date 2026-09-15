import { Router } from 'express'
import { listHabitsForUser, addHabit, findHabit, checkIn, getTeamMembers, getHabitMembers, getCheckInsForMonth } from '../data/store.js'

export const habitsRouter = Router()

habitsRouter.get('/', async (req, res, next) => {
  try {
    const habits = await listHabitsForUser(req.telegramUser.id)
    res.json({ habits })
  } catch (err) {
    next(err)
  }
})

habitsRouter.post('/', async (req, res, next) => {
  try {
    const { name, type, frequency, breakRule } = req.body ?? {}
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' })
    }
    const habit = await addHabit({
      ownerId: req.telegramUser.id,
      name: name.trim(),
      type: type ?? 'solo',
      frequency,
      breakRule,
    })
    res.status(201).json({ habit })
  } catch (err) {
    next(err)
  }
})

habitsRouter.get('/:id', async (req, res, next) => {
  try {
    const habit = await findHabit(req.params.id)
    if (!habit) return res.status(404).json({ error: 'not found' })
    res.json({ habit })
  } catch (err) {
    next(err)
  }
})

habitsRouter.get('/:id/team', async (req, res, next) => {
  try {
    const habit = await findHabit(req.params.id)
    if (!habit || habit.type !== 'team') return res.status(404).json({ error: 'not a team habit' })
    const members = await getTeamMembers(habit.id)
    res.json({ habit, members })
  } catch (err) {
    next(err)
  }
})

habitsRouter.get('/:id/members', async (req, res, next) => {
  try {
    const habit = await findHabit(req.params.id)
    if (!habit) return res.status(404).json({ error: 'not found' })
    const members = await getHabitMembers(habit.id)
    res.json({ members })
  } catch (err) {
    next(err)
  }
})

// ?month=YYYY-MM, defaults to the current month
habitsRouter.get('/:id/checkins', async (req, res, next) => {
  try {
    const habit = await findHabit(req.params.id)
    if (!habit) return res.status(404).json({ error: 'not found' })

    const now = new Date()
    const [year, month] = (req.query.month ?? `${now.getFullYear()}-${now.getMonth() + 1}`)
      .split('-')
      .map(Number)

    const dates = await getCheckInsForMonth(habit.id, year, month)
    res.json({ dates })
  } catch (err) {
    next(err)
  }
})

habitsRouter.post('/:id/checkin', async (req, res, next) => {
  try {
    const habit = await checkIn(req.params.id, req.telegramUser.id)
    if (!habit) return res.status(404).json({ error: 'not found' })
    res.json({ habit })
  } catch (err) {
    next(err)
  }
})
