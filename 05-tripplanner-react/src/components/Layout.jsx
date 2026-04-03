import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Navbar from './Navbar'

export default function Layout() {
  const { ready } = useAuth()

  if (!ready) {
    return (
      <div className="auth-loading" role="status">
        Loading…
      </div>
    )
  }

  return (
    <>
      <header>
        <Navbar />
      </header>
      <Outlet />
      <footer>
        <p>&copy; 2026 TripPlanner. All rights reserved.</p>
      </footer>
    </>
  )
}
