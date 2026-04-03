import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchAllCountries, getExploreCacheSync } from '../api/countries'
import { toggleWishlistCountry } from '../store/wishlistSlice'

const PAGE_SIZE = 12

const REGIONS = ['all', 'Africa', 'Americas', 'Asia', 'Europe', 'Oceania']

function formatNumber(value) {
  if (typeof value !== 'number') return '-'
  return value.toLocaleString('en-US')
}

export default function Explore() {
  const dispatch = useDispatch()
  const wishlistCodes = useSelector((s) =>
    new Set(s.wishlist.items.map((c) => c.cca3))
  )

  const [allCountries, setAllCountries] = useState(
    () => getExploreCacheSync() ?? []
  )
  const [loadError, setLoadError] = useState(null)
  const [loading, setLoading] = useState(() => getExploreCacheSync() == null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentRegion, setCurrentRegion] = useState('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchAllCountries()
        if (!cancelled) {
          setAllCountries(data)
          setLoadError(null)
        }
      } catch (e) {
        if (!cancelled) {
          setAllCountries((prev) => {
            if (prev.length > 0) return prev
            return getExploreCacheSync() ?? []
          })
          setLoadError(() => {
            const cached = getExploreCacheSync()
            if (cached?.length) return null
            return e.message || 'Could not load countries'
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredByRegion = useMemo(() => {
    if (currentRegion === 'all') return allCountries
    return allCountries.filter((c) => c.region === currentRegion)
  }, [allCountries, currentRegion])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return filteredByRegion
    return filteredByRegion.filter((c) => {
      const name = c.name?.common?.toLowerCase() ?? ''
      const cap = c.capital?.[0]?.toLowerCase() ?? ''
      return name.includes(q) || cap.includes(q)
    })
  }, [filteredByRegion, searchQuery])

  const visibleCountries = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  )

  const onRegionClick = (region) => {
    setCurrentRegion(region)
    setVisibleCount(PAGE_SIZE)
  }

  const loadMore = useCallback(() => {
    setVisibleCount((n) => n + PAGE_SIZE)
  }, [])

  const showLoadMore = visibleCountries.length < filtered.length

  return (
    <main className="explore-page">
      <section className="explore-hero">
        <h1>Explore the world</h1>
        <p className="explore-tagline">
          Discover countries, compare destinations, and plan your next adventure.
        </p>
        <div className="explore-search-wrap">
          <input
            className="explore-search-input"
            type="search"
            placeholder="Search by country or capital…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setVisibleCount(PAGE_SIZE)
            }}
            aria-label="Search countries"
          />
        </div>
      </section>

      <div className="explore-toolbar">
        <div className="region-buttons explore-regions">
          {REGIONS.map((region) => (
            <button
              key={region}
              type="button"
              className={`region-button${currentRegion === region ? ' active' : ''}`}
              data-region={region}
              onClick={() => onRegionClick(region)}
            >
              {region === 'all' ? 'All' : region}
            </button>
          ))}
        </div>
        <span className="explore-count" id="countries-count">
          Showing {visibleCountries.length}
          {filtered.length !== visibleCountries.length
            ? ` of ${filtered.length}`
            : ''}{' '}
          countries
        </span>
      </div>

      <section className="explore-grid-section">
        <div id="countries-grid" className="countries explore-countries">
          {loading && allCountries.length === 0 && (
            <p className="explore-loading" role="status">
              Loading countries…
            </p>
          )}
          {loadError && allCountries.length === 0 && (
            <p className="page-error explore-error">
              {loadError}. Please refresh and try again.
            </p>
          )}
          {(!loadError || visibleCountries.length > 0) &&
            visibleCountries.map((country) => {
              const flagUrl =
                country.flags?.svg || country.flags?.png || ''
              const capital =
                country.capital?.length > 0 ? country.capital[0] : 'N/A'
              const inList = wishlistCodes.has(country.cca3)

              return (
                <article className="card explore-card" key={country.cca3}>
                  <Link
                    to={`/country/${country.cca3}`}
                    className="card-media-link"
                  >
                    <img
                      className="country-flag"
                      src={flagUrl}
                      alt={`${country.name.common} flag`}
                    />
                  </Link>
                  <div className="card-content">
                    <h3 className="country-name">
                      <Link to={`/country/${country.cca3}`}>
                        {country.name.common}
                      </Link>
                    </h3>
                    <p className="country-capital">Capital: {capital}</p>
                    <p className="country-population">
                      Population: {formatNumber(country.population)}
                    </p>
                    <p className="country-area">
                      Area: {formatNumber(country.area)} km²
                    </p>
                    <p className="country-region">
                      {country.region || 'Unknown region'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="heart explore-heart"
                    aria-label={
                      inList ? 'Remove from wishlist' : 'Add to wishlist'
                    }
                    onClick={(e) => {
                      e.preventDefault()
                      dispatch(toggleWishlistCountry(country))
                    }}
                  >
                    {inList ? '♥' : '♡'}
                  </button>
                </article>
              )
            })}
        </div>

        {!loadError && showLoadMore && (
          <div className="load-more explore-load-more">
            <button
              type="button"
              id="load-more-btn"
              className="load-more-button explore-load-btn"
              onClick={loadMore}
            >
              Load more
            </button>
          </div>
        )}
      </section>
    </main>
  )
}
