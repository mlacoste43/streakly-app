import { tg } from './telegram.js'

// Set this in a .env file for local dev (VITE_API_URL=http://localhost:3000)
// and in Vercel's project settings for production (your deployed server URL).
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function request(path, options = {}) {
  const initData = tg?.initData ?? ''
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `tma ${initData}`,
      'X-Timezone': timezone,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed: ${res.status}`)
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  getMe: () => request('/api/me'),
  patchMe: (data) => request('/api/me', { method: 'PATCH', body: JSON.stringify(data) }),
  getHabits: () => request('/api/habits'),
  createHabit: (data) => request('/api/habits', { method: 'POST', body: JSON.stringify(data) }),
  updateHabit: (id, data) => request(`/api/habits/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteHabit: (id) => request(`/api/habits/${id}`, { method: 'DELETE' }),
  checkIn: (id) => request(`/api/habits/${id}/checkin`, { method: 'POST' }),
  getTeam: (id) => request(`/api/habits/${id}/team`),
  getMembers: (id) => request(`/api/habits/${id}/members`),
  getCheckIns: (id, month) => request(`/api/habits/${id}/checkins${month ? `?month=${month}` : ''}`),
  getInviteLink: (id) => request(`/api/habits/${id}/invite`),
  joinHabit: (id, token) => request(`/api/habits/${id}/join`, { method: 'POST', body: JSON.stringify({ token }) }),
}
