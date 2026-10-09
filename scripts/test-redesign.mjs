import assert from 'node:assert/strict'
import { achievements, nextMilestone } from '../src/redesign/achievements.js'
const zero = { completed: 0, activeDays: 0, bestStreak: 0, bestWeek: 0, bestMonth: 0, sharedCompleted: 0, comebacks: 0 }
assert.equal(achievements(undefined).length, 0)
assert.equal(achievements(zero).length, 24)
assert.equal(new Set(achievements(zero).map(a => a.id)).size, 24)
assert.equal(achievements(zero).filter(a => a.unlocked).length, 0)
assert.equal(achievements({ ...zero, completed: 1 }).filter(a => a.unlocked).length, 1)
assert.equal(achievements({ ...zero, bestStreak: 7 }).filter(a => a.unlocked).length, 2)
assert.equal(achievements({ ...zero, sharedCompleted: 10 }).filter(a => a.unlocked).length, 2)
assert.equal(achievements({ ...zero, comebacks: 1 }).find(a => a.id === 'return').unlocked, true)
assert.equal(nextMilestone(0), 3)
assert.equal(nextMilestone(7), 14)
assert.equal(nextMilestone(365), 400)
assert.equal(nextMilestone(400), 500)
assert.equal(achievements({ completed: -5 }).find(a => a.id === 'done-1').value, 0)
console.log('Achievement unit tests passed.')
