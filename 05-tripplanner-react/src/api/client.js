const BASE = import.meta.env.VITE_API_URL ?? ''

function url(path) {
  if (path.startsWith('http')) return path
  const p = path.startsWith('/') ? path : `/${path}`
  return `${BASE}${p}`
}

const API_HELP =
  'Start the API in another terminal: cd server && npm run dev (needs server/.env with MONGODB_URI). Or run: npm run dev:all'

export async function apiFetch(path, options = {}) {
  const headers = { ...options.headers }
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  let res
  try {
    res = await fetch(url(path), {
      ...options,
      headers,
    })
  } catch (e) {
    const err = new Error(
      `Cannot reach the API (${e.message}). ${API_HELP}`
    )
    err.cause = e
    throw err
  }

  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }
  if (!res.ok) {
    let msg = data?.error || res.statusText || 'Request failed'
    if (res.status === 502 || res.status === 503) {
      msg = `Bad gateway (${res.status}): Vite could not reach the backend on port 5000. ${API_HELP}`
    }
    const err = new Error(msg)
    err.status = res.status
    throw err
  }
  return data
}

export function apiUrl(path) {
  return url(path)
}
