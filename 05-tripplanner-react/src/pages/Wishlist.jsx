import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { removeFromWishlist } from '../store/wishlistSlice'

export default function Wishlist() {
  const dispatch = useDispatch()
  const list = useSelector((s) => s.wishlist.items)

  return (
    <main className="wishlist-page">
      <header className="wishlist-page-header">
        <div className="wishlist-page-title">
          <h1>My wishlist</h1>
          <p id="wishlist-count" className="wishlist-page-sub">
            {list.length}{' '}
            {list.length === 1 ? 'country' : 'countries'} saved
          </p>
        </div>
        <Link to="/planner" className="wishlist-plan-btn">
          Plan a trip
        </Link>
      </header>

      {list.length === 0 ? (
        <section className="wishlist-empty-panel" id="empty-state">
          <div className="wishlist-empty-icon" aria-hidden>
            ♡
          </div>
          <h2>Your wishlist is empty</h2>
          <p>
            Explore countries and tap the heart to save favorites here.
          </p>
          <Link to="/" className="wishlist-empty-cta">
            Explore countries
          </Link>
        </section>
      ) : (
        <section className="wishlist-grid" id="wishlist-grid">
          {list.map((country) => (
            <article className="wishlist-card wishlist-card-enhanced" key={country.cca3}>
              <Link
                to={`/country/${country.cca3}`}
                className="wishlist-card-main"
              >
                <img
                  className="wishlist-flag"
                  src={country.flag}
                  alt=""
                />
                <div className="wishlist-content">
                  <div className="wishlist-country">{country.name}</div>
                  <span className="wishlist-region-pill">{country.region}</span>
                  <div className="wishlist-details">
                    <span>
                      Capital <b>{country.capital}</b>
                    </span>
                    <span>
                      Population{' '}
                      <b>{Number(country.population || 0).toLocaleString()}</b>
                    </span>
                    <span>
                      Area{' '}
                      <b>{Number(country.area || 0).toLocaleString()} km²</b>
                    </span>
                  </div>
                </div>
              </Link>
              <button
                type="button"
                className="wishlist-heart"
                aria-label={`Remove ${country.name} from wishlist`}
                onClick={(e) => {
                  e.preventDefault()
                  dispatch(removeFromWishlist(country.cca3))
                }}
              >
                ♥
              </button>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
