import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useAuth } from '../context/AuthContext.jsx'

const WISHLIST_KEY = 'wishlist'
const TRIPS_KEY = 'tripplanner_trips'

/**
 * Guest mode: persist wishlist + trips to localStorage.
 * Logged-in users rely on MongoDB (see SyncUserData).
 */
export default function PersistRedux() {
  const { user } = useAuth()
  const wishlistItems = useSelector((s) => s.wishlist.items)
  const tripsItems = useSelector((s) => s.trips.items)

  useEffect(() => {
    if (user) return
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlistItems))
  }, [wishlistItems, user])

  useEffect(() => {
    if (user) return
    localStorage.setItem(TRIPS_KEY, JSON.stringify(tripsItems))
  }, [tripsItems, user])

  return null
}
