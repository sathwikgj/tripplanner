import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { createBooking, fetchBookings } from '../api/bookingApi.js'
import { fetchCountryCodes } from '../api/countries.js'

const emptyForm = {
  countryCode: '',
  fullName: '',
  email: '',
  phone: '',
  startDate: '',
  endDate: '',
  notes: '',
}

function bookingToForm(b) {
  return {
    countryCode: b.countryCode || '',
    fullName: b.fullName || '',
    email: b.email || '',
    phone: b.phone || '',
    startDate: b.startDate || '',
    endDate: b.endDate || '',
    notes: b.notes || '',
  }
}

/** True when saved booking matches current form (same trip + contact details). */
function sameBookingDetails(form, b) {
  if (!b || !form.countryCode) return false
  const norm = (s) => String(s || '').trim()
  return (
    norm(form.countryCode) === norm(b.countryCode) &&
    norm(form.fullName) === norm(b.fullName) &&
    norm(form.email).toLowerCase() === norm(b.email).toLowerCase() &&
    norm(form.phone) === norm(b.phone) &&
    norm(form.startDate) === norm(b.startDate) &&
    norm(form.endDate) === norm(b.endDate) &&
    norm(form.notes) === norm(b.notes)
  )
}

export default function Booking() {
  const { isLoggedIn, user } = useAuth()
  const [options, setOptions] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [list, setList] = useState([])
  const [loadingList, setLoadingList] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [autofillPick, setAutofillPick] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchCountryCodes()
        if (!cancelled) setOptions(data)
      } catch {
        if (!cancelled) setOptions([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isLoggedIn || !user?.email) return
    setForm((f) => (f.email ? f : { ...f, email: user.email }))
  }, [isLoggedIn, user?.email])

  useEffect(() => {
    if (!isLoggedIn) {
      setList([])
      return
    }
    let cancelled = false
    setLoadingList(true)
    ;(async () => {
      try {
        const { bookings } = await fetchBookings()
        if (!cancelled) setList(bookings || [])
      } catch {
        if (!cancelled) setList([])
      } finally {
        if (!cancelled) setLoadingList(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isLoggedIn, success])

  const countryName =
    options.find((c) => c.cca3 === form.countryCode)?.name?.common || ''

  const lastBookingForCountry = useMemo(() => {
    if (!form.countryCode || list.length === 0) return null
    return list.find((b) => b.countryCode === form.countryCode) || null
  }, [list, form.countryCode])

  function applyPastBooking(b) {
    if (!b) return
    setForm(bookingToForm(b))
    setAutofillPick(String(b._id))
    setError('')
    setSuccess('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.countryCode) {
      setError('Choose a country.')
      return
    }
    if (!form.fullName.trim() || !form.email.trim()) {
      setError('Name and email are required.')
      return
    }
    setSubmitting(true)
    try {
      await createBooking({
        countryCode: form.countryCode,
        countryName,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        notes: form.notes.trim(),
      })
      setSuccess('Booking submitted.')
      setAutofillPick('')
      setForm((f) => ({
        ...emptyForm,
        email: f.email,
      }))
    } catch (err) {
      setError(err.message || 'Could not save booking.')
    } finally {
      setSubmitting(false)
    }
  }

  function onChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  if (!isLoggedIn) {
    return (
      <main className="booking-page">
        <div className="booking-login-hint">
          <h1>Book a trip</h1>
          <p>
            Log in to submit a booking. We store your trip and contact details
            in your account.
          </p>
          <Link to="/login" className="booking-login-link">
            Log in
          </Link>{' '}
          or{' '}
          <Link to="/register" className="booking-login-link">
            Register
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="booking-page">
      <header className="booking-header">
        <h1>Book a trip</h1>
        <p className="booking-lead">
          Choose a country, add travel dates and your contact details. Bookings
          are saved to your account.
        </p>
      </header>

      <section className="booking-panel">
        <h2 className="booking-section-title">New booking</h2>
        {list.length > 0 && (
          <div className="booking-autofill">
            <div className="booking-field">
              <label htmlFor="bk-autofill">Autofill from a previous booking</label>
              <div className="booking-autofill-row">
                <select
                  id="bk-autofill"
                  className="booking-autofill-select"
                  value={autofillPick}
                  onChange={(e) => {
                    const id = e.target.value
                    setAutofillPick(id)
                    if (!id) return
                    const b = list.find((x) => String(x._id) === id)
                    if (b) applyPastBooking(b)
                  }}
                >
                  <option value="">— Choose a saved booking —</option>
                  {list.map((b) => (
                    <option key={b._id} value={String(b._id)}>
                      {b.countryName}
                      {b.startDate || b.endDate
                        ? ` · ${b.startDate || '—'} → ${b.endDate || '—'}`
                        : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="booking-autofill-last"
                  onClick={() => applyPastBooking(list[0])}
                  title="Copy details from your most recent booking"
                >
                  Use last booking
                </button>
              </div>
            </div>
          </div>
        )}

        <form className="booking-form" onSubmit={handleSubmit} autoComplete="on">
          <div className="booking-field">
            <label htmlFor="bk-country">Country</label>
            <select
              id="bk-country"
              value={form.countryCode}
              onChange={(e) => onChange('countryCode', e.target.value)}
              required
            >
              <option value="">Select a country</option>
              {options.map((c) => (
                <option key={c.cca3} value={c.cca3}>
                  {c.name.common}
                </option>
              ))}
            </select>
            {lastBookingForCountry &&
              !sameBookingDetails(form, lastBookingForCountry) && (
                <p className="booking-same-hint">
                  You have a saved trip to this country —{' '}
                  <button
                    type="button"
                    className="booking-same-link"
                    onClick={() => applyPastBooking(lastBookingForCountry)}
                  >
                    Autofill from that booking
                  </button>
                </p>
              )}
          </div>

          <div className="booking-row">
            <div className="booking-field">
              <label htmlFor="bk-start">Start date</label>
              <input
                id="bk-start"
                type="date"
                value={form.startDate}
                onChange={(e) => onChange('startDate', e.target.value)}
              />
            </div>
            <div className="booking-field">
              <label htmlFor="bk-end">End date</label>
              <input
                id="bk-end"
                type="date"
                value={form.endDate}
                onChange={(e) => onChange('endDate', e.target.value)}
              />
            </div>
          </div>

          <div className="booking-field">
            <label htmlFor="bk-name">Full name</label>
            <input
              id="bk-name"
              type="text"
              autoComplete="name"
              value={form.fullName}
              onChange={(e) => onChange('fullName', e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <div className="booking-field">
            <label htmlFor="bk-email">Email</label>
            <input
              id="bk-email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => onChange('email', e.target.value)}
              required
            />
          </div>

          <div className="booking-field">
            <label htmlFor="bk-phone">Phone (optional)</label>
            <input
              id="bk-phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              placeholder="+1 …"
            />
          </div>

          <div className="booking-field">
            <label htmlFor="bk-notes">Notes (optional)</label>
            <textarea
              id="bk-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => onChange('notes', e.target.value)}
              placeholder="Special requests, party size, etc."
            />
          </div>

          {error && <p className="page-error booking-msg">{error}</p>}
          {success && <p className="booking-success">{success}</p>}

          <button type="submit" className="booking-submit" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit booking'}
          </button>
        </form>
      </section>

      <section className="booking-panel booking-list-panel">
        <h2 className="booking-section-title">Your bookings</h2>
        {loadingList ? (
          <p className="booking-list-empty">Loading…</p>
        ) : list.length === 0 ? (
          <p className="booking-list-empty">No bookings yet.</p>
        ) : (
          <ul className="booking-list">
            {list.map((b) => (
              <li key={b._id} className="booking-item">
                <div className="booking-item-top">
                  <strong>{b.countryName}</strong>
                  <span className="booking-item-code">{b.countryCode}</span>
                </div>
                <p className="booking-item-meta">
                  {b.fullName} · {b.email}
                  {b.phone ? ` · ${b.phone}` : ''}
                </p>
                {(b.startDate || b.endDate) && (
                  <p className="booking-item-dates">
                    {b.startDate || '—'} → {b.endDate || '—'}
                  </p>
                )}
                {b.notes && <p className="booking-item-notes">{b.notes}</p>}
                <p className="booking-item-time">
                  {b.createdAt
                    ? new Date(b.createdAt).toLocaleString()
                    : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
