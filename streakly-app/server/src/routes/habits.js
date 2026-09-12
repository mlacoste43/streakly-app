import { Router } from 'express'
import { habits, teamMembers, addHabit, findHabit, checkIn } from '../data/store.js'

export const habitsRouter = Router()

habitsRouter.get('/', (req, res) => {
  res.json({ habits })
})

habitsRouter.post('/', (req, res) => {
  const { name, type, frequency, breakRule } = req.body ?? {}
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name is required' })
  }
  const habit = addHabit({ name: name.trim(), type: type ?? 'solo', frequency, breakRule })
  res.status(201).json({ habit })
})

habitsRouter.get('/:id', (req, res) => {
  const habit = findHabit(req.params.id)
  if (!habit) return res.status(404).json({ error: 'not found' })
  res.json({ habit })
})

habitsRouter.get('/:id/team', (req, res) => {
  const habit = findHabit(req.params.id)
  if (!habit || habit.type !== 'team') return res.status(404).json({ error: 'not a team habit' })
  res.json({ habit, members: teamMembers[habit.id] ?? [] })
})

habitsRouter.post('/:id/checkin', (req, res) => {
  const habit = checkIn(req.params.id)
  if (!habit) return res.status(404).json({ error: 'not found' })
  res.json({ habit })
})
