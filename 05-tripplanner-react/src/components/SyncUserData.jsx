import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useAuth } from '../context/AuthContext.jsx'
import { getStoredToken, saveUserData } from '../api/authApi.js'

/**
 * When logged in, debounced save of wishlist + trips to MongoDB via API.
 */
export default function SyncUserData() {
  const { user } = useAuth()
  const wishlist = useSelector((s) => s.wishlist.items)
  const trips = useSelector((s) => s.trips.items)
  const skipFirst = useRef(true)

  useEffect(() => {
    skipFirst.current = true
  }, [user?.email])

  useEffect(() => {
    if (!user) return

    const token = getStoredToken()
    if (!token) return

    if (skipFirst.current) {
      skipFirst.current = false
      return
    }

    const id = setTimeout(() => {
      saveUserData(token, { wishlist, trips }).catch(() => {})
    }, 600)

    return () => clearTimeout(id)
  }, [user, wishlist, trips])

  return null
}
