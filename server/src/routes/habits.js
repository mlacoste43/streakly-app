import { Router } from 'express'
import {
  listHabitsForUser, addHabit, findHabit, checkIn, getTeamMembers, getHabitMembers,
  getCheckInsForMonth, getFrozenDatesForMonth, updateHabit, deleteHabit,
  countHabitMembers, isHabitMember, joinHabit,
} from '../data/store.js'
import { notifyUser } from '../telegramBot.js'
import { buildInviteLink, verifyInviteToken } from '../invites.js'

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

    // If the month is omitted, calculate the current month in the user's
    // IANA timezone rather than the Render server's timezone. The frontend
    // sends the same timezone in X-Timezone on every authenticated request.
    const timezone = req.headers['x-timezone'] || 'UTC'
    const now = new Date()
    const localParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
    }).formatToParts(now)
    const localYear = localParts.find((part) => part.type === 'year')?.value
    const localMonth = localParts.find((part) => part.type === 'month')?.value
    const [year, month] = (req.query.month ?? `${localYear}-${localMonth}`)
      .split('-')
      .map(Number)

    const [dates, frozenDates] = await Promise.all([
      getCheckInsForMonth(habit.id, year, month),
      getFrozenDatesForMonth(habit.id, year, month),
    ])
    res.json({ dates, frozenDates })
  } catch (err) {
    next(err)
  }
})

habitsRouter.patch('/:id', async (req, res, next) => {
  try {
    const existing = await findHabit(req.params.id)
    if (!existing) return res.status(404).json({ error: 'not found' })
    if (String(existing.ownerId) !== String(req.telegramUser.id)) {
      return res.status(403).json({ error: 'only the owner can edit this habit' })
    }
    const { name, type, frequency, breakRule } = req.body ?? {}
    const habit = await updateHabit(req.params.id, {
      name: name?.trim(),
      type,
      frequency,
      breakRule,
    })
    res.json({ habit })
  } catch (err) {
    next(err)
  }
})

habitsRouter.delete('/:id', async (req, res, next) => {
  try {
    const existing = await findHabit(req.params.id)
    if (!existing) return res.status(404).json({ error: 'not found' })
    if (String(existing.ownerId) !== String(req.telegramUser.id)) {
      return res.status(403).json({ error: 'only the owner can delete this habit' })
    }
    await deleteHabit(req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

habitsRouter.get('/:id/invite', async (req, res, next) => {
  try {
    const habit = await findHabit(req.params.id)
    if (!habit) return res.status(404).json({ error: 'not found' })
    if (habit.type === 'solo') return res.status(400).json({ error: 'solo habits have nothing to invite to' })
    const member = await isHabitMember(habit.id, req.telegramUser.id)
    if (!member) return res.status(403).json({ error: 'only members can invite others' })

    const link = buildInviteLink(habit.id)
    if (!link) {
      return res.status(500).json({
        error: 'Invite links are not configured on the server (missing TELEGRAM_BOT_USERNAME / TELEGRAM_MINIAPP_SHORT_NAME)',
      })
    }
    res.json({ link })
  } catch (err) {
    next(err)
  }
})

habitsRouter.post('/:id/join', async (req, res, next) => {
  try {
    const habit = await findHabit(req.params.id)
    if (!habit) return res.status(404).json({ error: 'not found' })

    const { token } = req.body ?? {}
    if (!verifyInviteToken(habit.id, token)) {
      return res.status(403).json({ error: 'invalid or expired invite link' })
    }

    const alreadyIn = await isHabitMember(habit.id, req.telegramUser.id)
    if (alreadyIn) {
      return res.json({ habit, alreadyMember: true })
    }

    if (habit.type === 'duo') {
      const count = await countHabitMembers(habit.id)
      if (count >= 2) {
        return res.status(409).json({ error: 'this duo is already full' })
      }
    }

    const updated = await joinHabit(habit.id, req.telegramUser.id)
    res.json({ habit: updated, alreadyMember: false })

    notifyUser(
      habit.ownerId,
      `👋 ${req.telegramUser.first_name ?? 'Кто-то'} присоединился к «${habit.title}»!`
    ).catch((err) => console.error('Failed to send join notification', err))
  } catch (err) {
    next(err)
  }
})

habitsRouter.post('/:id/checkin', async (req, res, next) => {
  try {
    const habit = await checkIn(req.params.id, req.telegramUser.id)
    if (!habit) return res.status(404).json({ error: 'not found' })
    res.json({ habit })

    // fire-and-forget: a failed notification shouldn't fail the check-in
    // itself, so this runs after the response is already sent
    notifyUser(
      req.telegramUser.id,
      `✅ Отметил «${habit.title}» — стрик <b>${habit.days}</b> 🔥`
    ).catch((err) => console.error('Failed to send check-in notification', err))
  } catch (err) {
    next(err)
  }
})
