import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, isLoggedIn, logout } = useAuth()

  return (
    <nav className="navbar navbar-enhanced">
      <div className="nav-container nav-container-enhanced">
        <div className="logo logo-enhanced">
          <NavLink to="/" end>
            TripPlanner
          </NavLink>
        </div>

        <ul className="nav-main">
          <li>
            <NavLink to="/" end className="nav-link-pill">
              Explore
            </NavLink>
          </li>
          <li>
            <NavLink to="/wishlist" className="nav-link-pill">
              <span className="wheart" aria-hidden>
                ♡
              </span>
              Wishlist
            </NavLink>
          </li>
          <li>
            <NavLink to="/compare" className="nav-link-pill">
              Compare
            </NavLink>
          </li>
          <li>
            <NavLink to="/planner" className="nav-link-pill">
              Plan a Trip
            </NavLink>
          </li>
          <li>
            <NavLink to="/itinerary" className="nav-link-pill">
              Itinerary
            </NavLink>
          </li>
          <li>
            <NavLink to="/booking" className="nav-link-pill">
              Book
            </NavLink>
          </li>
        </ul>

        <div className="nav-actions">
          {isLoggedIn ? (
            <>
              <span className="nav-user" title={user?.email}>
                {user?.email}
              </span>
              <button
                type="button"
                className="nav-logout"
                onClick={() => logout()}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-link-pill nav-link-muted">
                Log in
              </NavLink>
              <NavLink to="/register" className="nav-register">
                Register
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
