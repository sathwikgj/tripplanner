import { configureStore } from '@reduxjs/toolkit'
import wishlistReducer from './wishlistSlice'
import tripsReducer from './tripsSlice'

const WISHLIST_KEY = 'wishlist'
const TRIPS_KEY = 'tripplanner_trips'
const TOKEN_KEY = 'tripplanner_token'

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json)
    return Array.isArray(v) ? v : fallback
  } catch {
    return fallback
  }
}

function hasAuthToken() {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem(TOKEN_KEY)
}

function loadWishlist() {
  if (typeof window === 'undefined') return []
  if (hasAuthToken()) return []
  return safeParse(localStorage.getItem(WISHLIST_KEY), [])
}

function loadTrips() {
  if (typeof window === 'undefined') return []
  if (hasAuthToken()) return []
  return safeParse(localStorage.getItem(TRIPS_KEY), [])
}

export const store = configureStore({
  reducer: {
    wishlist: wishlistReducer,
    trips: tripsReducer,
  },
  preloadedState: {
    wishlist: { items: loadWishlist() },
    trips: { items: loadTrips() },
  },
})
