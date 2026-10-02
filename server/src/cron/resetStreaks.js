import cron from 'node-cron'
import { resetMissedStreaks } from '../data/store.js'

let resetRunning = false

export async function runStreakReset() {
  if (resetRunning) return { broken: [], frozen: [] }

  resetRunning = true
  try {
    const { broken, frozen } = await resetMissedStreaks()

    if (broken.length > 0) {
      console.log(
        `Streak reset: broke ${broken.length} streak(s) ->`,
        broken.map((h) => h.title).join(', ')
      )
    }

    if (frozen.length > 0) {
      console.log(
        `Streak reset: saved ${frozen.length} streak(s) with a freeze ->`,
        frozen.map((h) => h.title).join(', ')
      )
    }

    if (broken.length === 0 && frozen.length === 0) {
      console.log('Streak reset: nothing to break')
    }

    return { broken, frozen }
  } finally {
    resetRunning = false
  }
}

/*
 * IMPORTANT:
 * node-cron only runs while the Node process is actually alive.
 * Therefore this is a safety net, not the only mechanism.
 *
 * We run every 15 minutes instead of once at 00:05 because users can
 * have different timezones and the server timezone is not their timezone.
 */
export function scheduleStreakReset() {
  cron.schedule('*/15 * * * *', () => {
    runStreakReset().catch((err) => {
      console.error('Streak reset failed', err)
    })
  })

  console.log('Streak reset job scheduled every 15 minutes')
}
