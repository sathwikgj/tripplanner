import mongoose from 'mongoose'

const wishlistItemSchema = new mongoose.Schema(
  {
    cca3: { type: String, required: true },
    name: String,
    capital: String,
    region: String,
    population: Number,
    area: Number,
    flag: String,
  },
  { _id: false }
)

const tripSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: String,
    countryCode: String,
    startDate: String,
    endDate: String,
    notes: String,
    createdAt: String,
  },
  { _id: false }
)

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: { type: String, required: true },
  wishlist: { type: [wishlistItemSchema], default: [] },
  trips: { type: [tripSchema], default: [] },
})

export default mongoose.model('User', userSchema)
