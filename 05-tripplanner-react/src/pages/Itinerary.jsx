import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

export default function Itinerary() {
  const wishlist = useSelector((s) => s.wishlist.items)
  const trips = useSelector((s) => s.trips.items)

  const byCode = useMemo(
    () => Object.fromEntries(wishlist.map((c) => [c.cca3, c])),
    [wishlist]
  )

  const countryName = (code) => byCode[code]?.name || code

  return (
    <main className="itinerary-page">
      <header className="itinerary-header">
        <h1>Itinerary</h1>
        <p className="itinerary-lead">
          Your wishlist destinations and planned trips in one place.
        </p>
      </header>

      <div className="itinerary-grid">
        <section className="itinerary-card itinerary-card-wishlist">
          <div className="itinerary-card-head">
            <h2>Wishlist</h2>
            <span className="itinerary-count">{wishlist.length}</span>
          </div>
          {wishlist.length === 0 ? (
            <p className="itinerary-empty">
              No countries saved yet.{' '}
              <Link to="/">Browse Explore</Link> to add places you love.
            </p>
          ) : (
            <ul className="itinerary-wishlist">
              {wishlist.map((c) => (
                <li key={c.cca3}>
                  <Link to={`/country/${c.cca3}`} className="itinerary-wishlist-link">
                    {c.flag ? (
                      <img
                        src={c.flag}
                        alt=""
                        className="itinerary-flag"
                        width={44}
                        height={28}
                      />
                    ) : (
                      <span className="itinerary-flag-placeholder" aria-hidden>
                        ◆
                      </span>
                    )}
                    <div className="itinerary-wishlist-text">
                      <span className="itinerary-wishlist-name">{c.name}</span>
                      <span className="itinerary-wishlist-region">{c.region}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="itinerary-card itinerary-card-trips">
          <div className="itinerary-card-head">
            <h2>Planned trips</h2>
            <span className="itinerary-count">{trips.length}</span>
          </div>
          {trips.length === 0 ? (
            <p className="itinerary-empty">
              No trips yet.{' '}
              <Link to="/planner">Create a trip</Link> on the planner page.
            </p>
          ) : (
            <ul className="itinerary-trip-cards">
              {trips.map((t) => {
                const meta = byCode[t.countryCode]
                return (
                  <li key={t.id} className="itinerary-trip-card">
                    <div className="itinerary-trip-top">
                      <strong className="itinerary-trip-title">{t.title}</strong>
                      {meta?.flag && (
                        <img
                          src={meta.flag}
                          alt=""
                          className="itinerary-trip-flag"
                          width={36}
                          height={24}
                        />
                      )}
                    </div>
                    <p className="itinerary-trip-country">
                      {countryName(t.countryCode)}
                    </p>
                    {t.startDate && t.endDate && (
                      <p className="itinerary-trip-dates">
                        <span className="itinerary-date-label">Dates</span>
                        {t.startDate} → {t.endDate}
                      </p>
                    )}
                    {t.notes && (
                      <p className="itinerary-trip-notes">{t.notes}</p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
