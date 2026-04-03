import { apiFetch } from './client.js'

/**
 * All country HTTP calls go through our backend (`/api/countries/*`), not REST Countries
 * directly from the browser.
 */

const EXPLORE_CACHE_KEY = 'tripplanner_explore_countries_v1'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

function parseExploreCache() {
  try {
    const raw = sessionStorage.getItem(EXPLORE_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.data)) return null
    return { data: parsed.data, ts: parsed.ts ?? 0 }
  } catch {
    return null
  }
}

function isFresh(ts) {
  return Date.now() - ts < CACHE_TTL_MS
}

export function getExploreCacheSync() {
  const entry = parseExploreCache()
  return entry?.data ?? null
}

function writeExploreCache(data) {
  try {
    sessionStorage.setItem(
      EXPLORE_CACHE_KEY,
      JSON.stringify({ data, ts: Date.now() })
    )
  } catch {
    // quota / private mode
  }
}

let inflightAllCountries = null

export async function fetchAllCountries() {
  const entry = parseExploreCache()
  if (entry && isFresh(entry.ts)) {
    return entry.data
  }

  if (inflightAllCountries) {
    return inflightAllCountries
  }

  inflightAllCountries = (async () => {
    try {
      const data = await apiFetch('/api/countries/all')
      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) =>
            a.name.common.localeCompare(b.name.common)
          )
        : data
      writeExploreCache(sorted)
      return sorted
    } finally {
      inflightAllCountries = null
    }
  })()

  return inflightAllCountries
}

export async function fetchCountryCodes() {
  return apiFetch('/api/countries/codes')
}

export async function fetchCountriesByCodes(codes) {
  const unique = [...new Set(codes.filter(Boolean))]
  if (unique.length === 0) return []
  const q = unique.map(encodeURIComponent).join(',')
  return apiFetch(`/api/countries/batch?codes=${q}`)
}

export async function fetchCountryByCode(cca3) {
  return apiFetch(`/api/countries/alpha/${encodeURIComponent(cca3)}`)
}
