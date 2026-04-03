import express from 'express'
import Booking from '../models/Booking.js'
import { authRequired } from '../middleware/auth.js'

const router = express.Router()

router.use(authRequired)

/** List bookings for the logged-in user (newest first) */
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .lean()
    res.json({ bookings })
  } catch (e) {
    console.error('GET /api/bookings', e)
    res.status(500).json({ error: 'Could not load bookings' })
  }
})

/** Create a booking */
router.post('/', async (req, res) => {
  try {
    const countryCode = String(req.body?.countryCode || '').trim()
    const countryName = String(req.body?.countryName || '').trim()
    const fullName = String(req.body?.fullName || '').trim()
    const email = String(req.body?.email || '').trim().toLowerCase()
    const phone = String(req.body?.phone || '').trim()
    const startDate = String(req.body?.startDate || '').trim()
    const endDate = String(req.body?.endDate || '').trim()
    const notes = String(req.body?.notes || '').trim()

    if (!countryCode || !countryName || !fullName || !email) {
      return res.status(400).json({
        error: 'countryCode, countryName, fullName, and email are required',
      })
    }

    const booking = await Booking.create({
      userId: req.userId,
      countryCode,
      countryName,
      startDate,
      endDate,
      fullName,
      email,
      phone,
      notes,
    })

    res.status(201).json({
      booking: {
        id: booking._id.toString(),
        countryCode: booking.countryCode,
        countryName: booking.countryName,
        startDate: booking.startDate,
        endDate: booking.endDate,
        fullName: booking.fullName,
        email: booking.email,
        phone: booking.phone,
        notes: booking.notes,
        createdAt: booking.createdAt,
      },
    })
  } catch (e) {
    console.error('POST /api/bookings', e)
    res.status(500).json({ error: 'Could not create booking' })
  }
})

export default router
