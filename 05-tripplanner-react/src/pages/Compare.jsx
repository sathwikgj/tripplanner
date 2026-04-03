import { useEffect, useState } from 'react'
import { fetchCountriesByCodes, fetchCountryCodes } from '../api/countries'

export default function Compare() {
  const [options, setOptions] = useState([])
  const [optionsError, setOptionsError] = useState(null)
  const [country1, setCountry1] = useState('')
  const [country2, setCountry2] = useState('')
  const [country3, setCountry3] = useState('')
  const [comparison, setComparison] = useState([])
  const [compareError, setCompareError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchCountryCodes()
        if (!cancelled) {
          setOptions(data)
          setOptionsError(null)
        }
      } catch (e) {
        if (!cancelled) setOptionsError(e.message || 'Failed to load list')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const codes = [country1, country2, country3].filter(Boolean)
    const uniqueCodes = [...new Set(codes)]

    if (uniqueCodes.length === 0) {
      setComparison([])
      setCompareError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const countries = await fetchCountriesByCodes(uniqueCodes)
        if (!cancelled) {
          setComparison(countries)
          setCompareError(null)
        }
      } catch (e) {
        if (!cancelled) setCompareError(e.message || 'Failed to compare')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [country1, country2, country3])

  const renderCell = (c, row) => row.value(c)

  const rows = [
    {
      label: 'Capital',
      value: (c) => c.capital?.[0] || 'N/A',
    },
    {
      label: 'Region',
      value: (c) => c.region,
    },
    {
      label: 'Subregion',
      value: (c) => c.subregion || 'N/A',
    },
    {
      label: 'Population',
      value: (c) => c.population?.toLocaleString() ?? '-',
    },
    {
      label: 'Area',
      value: (c) =>
        c.area != null ? `${c.area.toLocaleString()} km²` : 'N/A',
    },
    {
      label: 'Languages',
      value: (c) =>
        c.languages ? Object.values(c.languages).join(', ') : 'N/A',
    },
    {
      label: 'Currencies',
      value: (c) =>
        c.currencies
          ? Object.values(c.currencies)
              .map((cur) => cur.name)
              .join(', ')
          : 'N/A',
    },
    {
      label: 'Timezones',
      value: (c) => (c.timezones ? c.timezones.join(', ') : 'N/A'),
    },
  ]

  return (
    <main className="compare-page">
      <header className="compare-page-header">
        <h1>Compare countries</h1>
        <p className="compare-page-lead">
          Pick two or three countries and see population, area, languages, and
          more side by side.
        </p>
      </header>

      <div className="comparison-container compare-inner">
        {optionsError && (
          <p className="page-error compare-page-error">{optionsError}</p>
        )}

        <section className="compare-select-panel" aria-label="Country selectors">
          <div className="compare-container compare-selects">
            <div className="country-box compare-country-box">
              <label htmlFor="country1">Country 1</label>
              <select
                id="country1"
                value={country1}
                onChange={(e) => setCountry1(e.target.value)}
              >
                <option value="">Select a country</option>
                {options.map((c) => (
                  <option key={c.cca3} value={c.cca3}>
                    {c.name.common}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="clear-btn compare-clear"
                onClick={() => setCountry1('')}
              >
                Clear
              </button>
            </div>
            <div className="country-box compare-country-box">
              <label htmlFor="country2">Country 2</label>
              <select
                id="country2"
                value={country2}
                onChange={(e) => setCountry2(e.target.value)}
              >
                <option value="">Select a country</option>
                {options.map((c) => (
                  <option key={c.cca3} value={c.cca3}>
                    {c.name.common}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="clear-btn compare-clear"
                onClick={() => setCountry2('')}
              >
                Clear
              </button>
            </div>
            <div className="country-box compare-country-box">
              <label htmlFor="country3">Country 3 (optional)</label>
              <select
                id="country3"
                value={country3}
                onChange={(e) => setCountry3(e.target.value)}
              >
                <option value="">Select a country</option>
                {options.map((c) => (
                  <option key={c.cca3} value={c.cca3}>
                    {c.name.common}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="clear-btn compare-clear"
                onClick={() => setCountry3('')}
              >
                Clear
              </button>
            </div>
          </div>
        </section>

        <div id="comparisonTable" className="compare-table-wrap">
          {loading && (
            <p className="compare-loading compare-loading-box">
              Loading comparison…
            </p>
          )}
          {compareError && (
            <p className="page-error">{compareError}</p>
          )}
          {!loading && comparison.length > 0 && (
            <div className="compare-table-scroll">
              <table className="compare-table compare-table-enhanced">
                <thead>
                  <tr>
                    <th>Attribute</th>
                    {comparison.map((c) => (
                      <th key={c.cca3}>{c.name.common}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>Flag</strong>
                    </td>
                    {comparison.map((c) => (
                      <td key={c.cca3}>
                        <img
                          src={c.flags?.png || c.flags?.svg || ''}
                          alt=""
                          width={60}
                          className="compare-flag-img"
                        />
                      </td>
                    ))}
                  </tr>
                  {rows.map((row) => (
                    <tr key={row.label}>
                      <td>
                        <strong>{row.label}</strong>
                      </td>
                      {comparison.map((c) => (
                        <td key={c.cca3}>{renderCell(c, row)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
