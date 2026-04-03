import { createSlice, nanoid } from '@reduxjs/toolkit'

const tripsSlice = createSlice({
  name: 'trips',
  initialState: {
    items: [],
  },
  reducers: {
    hydrateTrips: (state, action) => {
      state.items = Array.isArray(action.payload) ? action.payload : []
    },
    addTrip: (state, action) => {
      const { title, countryCode, startDate, endDate, notes, id } =
        action.payload
      state.items.push({
        id: id || nanoid(),
        title: title?.trim() || 'Untitled trip',
        countryCode: countryCode || '',
        startDate: startDate || '',
        endDate: endDate || '',
        notes: notes || '',
        createdAt: action.payload.createdAt || new Date().toISOString(),
      })
    },
    removeTrip: (state, action) => {
      const id = action.payload
      state.items = state.items.filter((t) => t.id !== id)
    },
  },
})

export const { hydrateTrips, addTrip, removeTrip } = tripsSlice.actions

export default tripsSlice.reducer
