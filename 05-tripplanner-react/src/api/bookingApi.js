import { apiFetch } from './client.js'
import { getStoredToken } from './authApi.js'

function authHeaders() {
  const token = getStoredToken()
  if (!token) throw new Error('Not logged in')
  return { Authorization: `Bearer ${token}` }
}

export async function createBooking(payload) {
  return apiFetch('/api/bookings', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
}

export async function fetchBookings() {
  return apiFetch('/api/bookings', {
    headers: authHeaders(),
  })
}
