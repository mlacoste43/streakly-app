import cron from 'node-cron'
import { getPendingDeadlineReminders, markReminderSent } from '../data/store.js'
import { notifyUser } from '../telegramBot.js'

export async function runDeadlineReminders() {
  const pending = await getPendingDeadlineReminders()

  for (const r of pending) {
    try {
      await notifyUser(
        r.user_id,
        `⏰ Дедлайн по «${r.habit_title}» скоро — не дай цепочке разорваться!`
      )
      // mark sent even if the Telegram call failed softly (notifyUser
      // itself logs failures) - otherwise a persistently-blocked user
      // would get retried every 15 minutes all day for nothing
      await markReminderSent(r.habit_id, r.user_id, r.local_date)
    } catch (err) {
      console.error('Failed to send deadline reminder', err)
    }
  }

  if (pending.length > 0) {
    console.log(`Deadline reminders: sent ${pending.length}`)
  }
  return pending
}

// Runs every 15 minutes so each person's reminder window (based on their
// own timezone and the habit's deadline_hours) gets caught promptly
// without needing a per-user scheduled job.
export function scheduleDeadlineReminders() {
  cron.schedule('*/15 * * * *', () => {
    runDeadlineReminders().catch((err) => console.error('Deadline reminder job failed', err))
  })
  console.log('Deadline reminder job scheduled every 15 minutes')
}
