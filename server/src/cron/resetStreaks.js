import cron from 'node-cron'
import { resetMissedStreaks } from '../data/store.js'

export async function runStreakReset() {
  const broken = await resetMissedStreaks()
  if (broken.length > 0) {
    console.log(`Streak reset: broke ${broken.length} streak(s) ->`, broken.map((h) => h.title).join(', '))
  } else {
    console.log('Streak reset: nothing to break')
  }
  return broken
}

// Runs once a day at 00:05 server time. This is intentionally simple for
// now - it doesn't yet account for each user's own timezone (see
// habits.deadline_hours / a future per-user timezone column), so a habit's
// "day" currently ends at server midnight for everyone. Good enough for
// local development; worth revisiting once users span timezones for real.
export function scheduleStreakReset() {
  cron.schedule('5 0 * * *', () => {
    runStreakReset().catch((err) => console.error('Streak reset failed', err))
  })
  console.log('Streak reset job scheduled for 00:05 daily')
}
