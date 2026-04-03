import { createSlice } from '@reduxjs/toolkit'

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    items: [],
  },
  reducers: {
    hydrateWishlist: (state, action) => {
      state.items = Array.isArray(action.payload) ? action.payload : []
    },
    addToWishlist: (state, action) => {
      const item = action.payload
      if (!item?.cca3) return
      if (state.items.some((c) => c.cca3 === item.cca3)) return
      state.items.push(item)
    },
    removeFromWishlist: (state, action) => {
      const code = action.payload
      state.items = state.items.filter((c) => c.cca3 !== code)
    },
    toggleWishlistCountry: (state, action) => {
      const country = action.payload
      if (!country?.cca3) return
      const idx = state.items.findIndex((c) => c.cca3 === country.cca3)
      if (idx >= 0) {
        state.items.splice(idx, 1)
      } else {
        state.items.push({
          cca3: country.cca3,
          name: country.name.common,
          capital: country.capital?.[0] ?? 'N/A',
          region: country.region,
          population: country.population,
          area: country.area,
          flag: country.flags?.svg || country.flags?.png || '',
        })
      }
    },
  },
})

export const {
  hydrateWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlistCountry,
} = wishlistSlice.actions

export default wishlistSlice.reducer
