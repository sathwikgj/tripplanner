import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { addTrip, removeTrip } from '../store/tripsSlice'

export default function Planner() {
  const dispatch = useDispatch()
  const wishlist = useSelector((s) => s.wishlist.items)
  const trips = useSelector((s) => s.trips.items)

  const byCode = useMemo(
    () => Object.fromEntries(wishlist.map((c) => [c.cca3, c])),
    [wishlist]
  )

  const [title, setTitle] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!countryCode) return
    dispatch(
      addTrip({
        title,
        countryCode,
        startDate,
        endDate,
        notes,
      })
    )
    setTitle('')
    setCountryCode('')
    setStartDate('')
    setEndDate('')
    setNotes('')
  }

  const countryName = (code) => byCode[code]?.name || code

  return (
    <main className="planner-page">
      <header className="planner-header">
        <h1>Plan a trip</h1>
        <p className="planner-lead">
          Choose a destination from your wishlist, add dates and notes, then save.
          Your trips stay in your list below.
        </p>
      </header>

      {wishlist.length === 0 ? (
        <div className="planner-callout planner-callout-warn">
          <p>
            <strong>Your wishlist is empty.</strong> Add countries from Explore,
            then come back here to plan.
          </p>
          <Link to="/" className="planner-callout-btn">
            Go to Explore
          </Link>
        </div>
      ) : (
        <section className="planner-panel planner-panel-form" aria-labelledby="planner-new-title">
          <div className="planner-panel-head">
            <h2 id="planner-new-title">New trip</h2>
            <span className="planner-panel-tag">Step 1</span>
          </div>
          <form className="planner-form" onSubmit={handleSubmit}>
            <div className="planner-field">
              <label htmlFor="trip-title">Trip name</label>
              <input
                id="trip-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Spring in Lisbon"
                autoComplete="off"
              />
            </div>
            <div className="planner-field">
              <label htmlFor="trip-country">Country</label>
              <select
                id="trip-country"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                required
              >
                <option value="">Select from your wishlist</option>
                {wishlist.map((c) => (
                  <option key={c.cca3} value={c.cca3}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="planner-field planner-field-dates">
              <div>
                <label htmlFor="trip-start">Start date</label>
                <input
                  id="trip-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="trip-end">End date</label>
                <input
                  id="trip-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="planner-field">
              <label htmlFor="trip-notes">Notes</label>
              <textarea
                id="trip-notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Flights, hotels, budget, ideas…"
              />
            </div>
            <button type="submit" className="planner-save">
              Save trip
            </button>
          </form>
        </section>
      )}

      <section
        className="planner-panel planner-panel-saved"
        aria-labelledby="planner-saved-title"
      >
        <div className="planner-panel-head">
          <h2 id="planner-saved-title">Saved trips</h2>
          <span className="planner-count-badge">{trips.length}</span>
        </div>

        {trips.length === 0 ? (
          <p className="planner-saved-empty">
            No trips saved yet. Fill out the form above when your wishlist has
            countries.
          </p>
        ) : (
          <ul className="planner-trip-list">
            {trips.map((t) => {
              const meta = byCode[t.countryCode]
              return (
                <li key={t.id} className="planner-trip-item">
                  <div className="planner-trip-item-main">
                    {meta?.flag ? (
                      <img
                        src={meta.flag}
                        alt=""
                        className="planner-trip-flag"
                        width={48}
                        height={32}
                      />
                    ) : (
                      <span className="planner-trip-flag-ph" aria-hidden>
                        ◆
                      </span>
                    )}
                    <div className="planner-trip-body">
                      <div className="planner-trip-title-row">
                        <h3 className="planner-trip-name">{t.title}</h3>
                        <button
                          type="button"
                          className="planner-trip-remove"
                          onClick={() => dispatch(removeTrip(t.id))}
                          aria-label={`Delete trip ${t.title}`}
                        >
                          Remove
                        </button>
                      </div>
                      <p className="planner-trip-destination">
                        {countryName(t.countryCode)}
                      </p>
                      {t.startDate && t.endDate && (
                        <p className="planner-trip-when">
                          <span className="planner-trip-when-label">Travel</span>
                          {t.startDate} → {t.endDate}
                        </p>
                      )}
                      {t.notes && (
                        <p className="planner-trip-notes-block">{t.notes}</p>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}
