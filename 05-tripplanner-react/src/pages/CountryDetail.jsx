import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { fetchCountryByCode } from '../api/countries'
import { toggleWishlistCountry } from '../store/wishlistSlice'

export default function CountryDetail() {
  const { cca3 } = useParams()
  const dispatch = useDispatch()
  const inWishlist = useSelector((s) =>
    s.wishlist.items.some((c) => c.cca3 === cca3)
  )

  const [country, setCountry] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const data = await fetchCountryByCode(cca3)
        if (!cancelled) setCountry(data)
      } catch (e) {
        if (!cancelled) setError(e.message || 'Not found')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cca3])

  if (loading) {
    return (
      <main className="country-page country-page-state">
        <p className="country-loading-msg" role="status">
          Loading country…
        </p>
      </main>
    )
  }

  if (error || !country) {
    return (
      <main className="country-page country-page-state">
        <Link to="/" className="country-back">
          ← Back to Explore
        </Link>
        <div className="country-error-panel">
          <p className="page-error">{error || 'Country not found.'}</p>
        </div>
      </main>
    )
  }

  const flagUrl = country.flags?.svg || country.flags?.png || ''
  const capital = country.capital?.[0] || 'N/A'
  const borders = country.borders || []

  return (
    <main className="country-page country-page-detail">
      <Link to="/" className="country-back">
        ← Explore
      </Link>

      <header className="country-detail-hero">
        <img className="country-hero-flag" src={flagUrl} alt="" />
        <div className="country-detail-titles">
          <h1>{country.name.common}</h1>
          <p className="country-official">{country.name.official}</p>
        </div>
      </header>

      <button
        type="button"
        className={`country-wishlist-btn${inWishlist ? ' active' : ''}`}
        onClick={() => dispatch(toggleWishlistCountry(country))}
      >
        {inWishlist ? '♥ Saved to wishlist' : '♡ Add to wishlist'}
      </button>

      <section className="country-facts-panel" aria-labelledby="facts-heading">
        <h2 id="facts-heading" className="country-section-title">
          Facts
        </h2>
        <dl className="country-facts country-facts-grid">
          <div className="country-fact">
            <dt>Capital</dt>
            <dd>{capital}</dd>
          </div>
          <div className="country-fact">
            <dt>Region</dt>
            <dd>{country.region}</dd>
          </div>
          <div className="country-fact">
            <dt>Subregion</dt>
            <dd>{country.subregion || 'N/A'}</dd>
          </div>
          <div className="country-fact">
            <dt>Population</dt>
            <dd>{country.population?.toLocaleString()}</dd>
          </div>
          <div className="country-fact">
            <dt>Area</dt>
            <dd>
              {country.area != null
                ? `${country.area.toLocaleString()} km²`
                : 'N/A'}
            </dd>
          </div>
          <div className="country-fact">
            <dt>Languages</dt>
            <dd>
              {country.languages
                ? Object.values(country.languages).join(', ')
                : 'N/A'}
            </dd>
          </div>
          <div className="country-fact">
            <dt>Currencies</dt>
            <dd>
              {country.currencies
                ? Object.values(country.currencies)
                    .map((c) => c.name)
                    .join(', ')
                : 'N/A'}
            </dd>
          </div>
          <div className="country-fact country-fact-wide">
            <dt>Timezones</dt>
            <dd>
              {country.timezones ? country.timezones.join(', ') : 'N/A'}
            </dd>
          </div>
        </dl>
      </section>

      {borders.length > 0 && (
        <section className="country-borders country-borders-panel">
          <h2 className="country-section-title">Neighbours</h2>
          <ul className="country-borders-list">
            {borders.map((code) => (
              <li key={code}>
                <Link to={`/country/${code}`}>{code}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
