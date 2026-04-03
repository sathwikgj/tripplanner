import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useDispatch } from 'react-redux'
import {
  fetchMe,
  getStoredToken,
  login as apiLogin,
  register as apiRegister,
  saveUserData,
  setStoredToken,
} from '../api/authApi.js'
import { store } from '../store'
import { hydrateTrips } from '../store/tripsSlice.js'
import { hydrateWishlist } from '../store/wishlistSlice.js'

const GUEST_WL = 'tripplanner_guest_wishlist_backup'
const GUEST_TRIPS = 'tripplanner_guest_trips_backup'

const AuthContext = createContext(null)

function backupGuestLocalState() {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(
    GUEST_WL,
    localStorage.getItem('wishlist') || '[]'
  )
  sessionStorage.setItem(
    GUEST_TRIPS,
    localStorage.getItem('tripplanner_trips') || '[]'
  )
}

function restoreGuestLocalState(dispatch) {
  const w = sessionStorage.getItem(GUEST_WL)
  const t = sessionStorage.getItem(GUEST_TRIPS)
  if (w != null) localStorage.setItem('wishlist', w)
  if (t != null) localStorage.setItem('tripplanner_trips', t)
  try {
    dispatch(
      hydrateWishlist(
        JSON.parse(localStorage.getItem('wishlist') || '[]')
      )
    )
  } catch {
    dispatch(hydrateWishlist([]))
  }
  try {
    dispatch(
      hydrateTrips(
        JSON.parse(localStorage.getItem('tripplanner_trips') || '[]')
      )
    )
  } catch {
    dispatch(hydrateTrips([]))
  }
}

export function AuthProvider({ children }) {
  const dispatch = useDispatch()
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  const applyServerUser = useCallback(
    (u) => {
      dispatch(hydrateWishlist(u.wishlist ?? []))
      dispatch(hydrateTrips(u.trips ?? []))
      setUser({ email: u.email })
    },
    [dispatch]
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const token = getStoredToken()
      if (!token) {
        if (!cancelled) setReady(true)
        return
      }
      try {
        const { user: u } = await fetchMe(token)
        if (!cancelled) applyServerUser(u)
      } catch {
        setStoredToken(null)
        if (!cancelled) {
          try {
            dispatch(
              hydrateWishlist(
                JSON.parse(localStorage.getItem('wishlist') || '[]')
              )
            )
          } catch {
            dispatch(hydrateWishlist([]))
          }
          try {
            dispatch(
              hydrateTrips(
                JSON.parse(localStorage.getItem('tripplanner_trips') || '[]')
              )
            )
          } catch {
            dispatch(hydrateTrips([]))
          }
        }
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [applyServerUser, dispatch])

  const login = useCallback(
    async (email, password) => {
      backupGuestLocalState()
      const { token, user: u } = await apiLogin(email, password)
      setStoredToken(token)
      applyServerUser(u)
    },
    [applyServerUser]
  )

  const register = useCallback(
    async (email, password) => {
      backupGuestLocalState()
      const { token, user: u } = await apiRegister(email, password)
      setStoredToken(token)
      applyServerUser(u)
    },
    [applyServerUser]
  )

  const logout = useCallback(async () => {
    const token = getStoredToken()
    if (token && user) {
      const { wishlist, trips } = store.getState()
      try {
        await saveUserData(token, {
          wishlist: wishlist.items,
          trips: trips.items,
        })
      } catch {
        /* still log out locally */
      }
    }
    setStoredToken(null)
    setUser(null)
    restoreGuestLocalState(dispatch)
  }, [dispatch, user])

  const value = useMemo(
    () => ({
      user,
      ready,
      isLoggedIn: !!user,
      login,
      register,
      logout,
    }),
    [user, ready, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook paired with AuthProvider
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
