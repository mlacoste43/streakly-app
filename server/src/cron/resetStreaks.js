import cron from 'node-cron'
import { resetMissedStreaks } from '../data/store.js'

export async function runStreakReset() {
  const { broken, frozen } = await resetMissedStreaks()
  if (broken.length > 0) {
    console.log(`Streak reset: broke ${broken.length} streak(s) ->`, broken.map((h) => h.title).join(', '))
  }
  if (frozen.length > 0) {
    console.log(`Streak reset: saved ${frozen.length} streak(s) with a freeze ->`, frozen.map((h) => h.title).join(', '))
  }
  if (broken.length === 0 && frozen.length === 0) {
    console.log('Streak reset: nothing to break')
  }
  return { broken, frozen }
}

// Runs once a day at 00:05 server time, per-habit day boundaries follow
// the habit owner's own timezone (see store.js).
export function scheduleStreakReset() {
  cron.schedule('5 0 * * *', () => {
    runStreakReset().catch((err) => console.error('Streak reset failed', err))
  })
  console.log('Streak reset job scheduled for 00:05 daily')
}
