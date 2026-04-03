import { apiFetch } from './client.js'

const TOKEN_KEY = 'tripplanner_token'

export function getStoredToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export async function register(email, password) {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function login(email, password) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function fetchMe(token) {
  return apiFetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function saveUserData(token, { wishlist, trips }) {
  return apiFetch('/api/auth/me', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ wishlist, trips }),
  })
}
