import express from 'express'

/**
 * Upstream REST Countries API (server-side only — the browser never calls this).
 */
const UPSTREAM = 'https://restcountries.com/v3.1'

const FIELDS_EXPLORE =
  'name,capital,region,population,flags,cca3,area'
const FIELDS_CODES = 'name,cca3'

const router = express.Router()

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) {
    const err = new Error(`Upstream ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

/** Explore grid: all countries with selected fields, sorted by common name */
router.get('/all', async (_req, res) => {
  try {
    const data = await fetchJson(
      `${UPSTREAM}/all?fields=${FIELDS_EXPLORE}`
    )
    const sorted = data.sort((a, b) =>
      a.name.common.localeCompare(b.name.common)
    )
    res.json(sorted)
  } catch (e) {
    console.error('GET /api/countries/all', e)
    res.status(502).json({ error: 'Could not fetch countries from upstream' })
  }
})

/** Compare dropdowns: minimal name + code list */
router.get('/codes', async (_req, res) => {
  try {
    const data = await fetchJson(
      `${UPSTREAM}/all?fields=${FIELDS_CODES}`
    )
    const sorted = data.sort((a, b) =>
      a.name.common.localeCompare(b.name.common)
    )
    res.json(sorted)
  } catch (e) {
    console.error('GET /api/countries/codes', e)
    res.status(502).json({ error: 'Could not fetch country list from upstream' })
  }
})

/** Single country by alpha-3 code (detail page, compare rows) */
router.get('/alpha/:cca3', async (req, res) => {
  const code = String(req.params.cca3 || '').trim().toUpperCase()
  if (!code) {
    return res.status(400).json({ error: 'Missing country code' })
  }
  try {
    const data = await fetchJson(`${UPSTREAM}/alpha/${code}`)
    const country = Array.isArray(data) ? data[0] : data
    if (!country) {
      return res.status(404).json({ error: 'Country not found' })
    }
    res.json(country)
  } catch (e) {
    if (e.status === 404) {
      return res.status(404).json({ error: 'Country not found' })
    }
    console.error('GET /api/countries/alpha/:cca3', e)
    res.status(502).json({ error: 'Could not fetch country from upstream' })
  }
})

/**
 * Batch fetch by codes — one round trip from the app (compare table).
 * Query: ?codes=USA,DEU,FRA
 */
router.get('/batch', async (req, res) => {
  const raw = req.query.codes
  if (raw == null || String(raw).trim() === '') {
    return res.json([])
  }
  const codes = [
    ...new Set(
      String(raw)
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean)
    ),
  ]
  if (codes.length === 0) return res.json([])

  try {
    const results = await Promise.all(
      codes.map(async (code) => {
        try {
          const data = await fetchJson(`${UPSTREAM}/alpha/${code}`)
          return Array.isArray(data) ? data[0] : data
        } catch {
          return null
        }
      })
    )
    res.json(results.filter(Boolean))
  } catch (e) {
    console.error('GET /api/countries/batch', e)
    res.status(502).json({ error: 'Could not fetch countries from upstream' })
  }
})

export default router
