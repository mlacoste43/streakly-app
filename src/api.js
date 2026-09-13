import { tg } from './telegram.js'

// Set this in a .env file for local dev (VITE_API_URL=http://localhost:3000)
// and in Vercel's project settings for production (your deployed server URL).
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function request(path, options = {}) {
  const initData = tg?.initData ?? ''

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `tma ${initData}`,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed: ${res.status}`)
  }

  return res.json()
}

export const api = {
  getMe: () => request('/api/me'),
  getHabits: () => request('/api/habits'),
  createHabit: (data) => request('/api/habits', { method: 'POST', body: JSON.stringify(data) }),
  checkIn: (id) => request(`/api/habits/${id}/checkin`, { method: 'POST' }),
  getTeam: (id) => request(`/api/habits/${id}/team`),
}
