import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    countryCode: { type: String, required: true, trim: true },
    countryName: { type: String, required: true, trim: true },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: '', trim: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
)

export default mongoose.model('Booking', bookingSchema)
