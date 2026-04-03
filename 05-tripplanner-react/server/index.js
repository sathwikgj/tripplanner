import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from './models/User.js'
import { authRequired, signToken } from './middleware/auth.js'
import countriesRouter from './routes/countries.js'
import bookingsRouter from './routes/bookings.js'

const app = express()
const PORT = process.env.PORT || 5000

const clientOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((s) => s.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173']

app.use(
  cors({
    origin: clientOrigins,
    credentials: true,
  })
)
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

/** Country data — proxied from upstream; browser uses only these routes */
app.use('/api/countries', countriesRouter)

/** Trip bookings (requires login) */
app.use('/api/bookings', bookingsRouter)

app.post('/api/auth/register', async (req, res) => {
  try {
    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase()
    const password = String(req.body?.password || '')

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 6 characters' })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ email, passwordHash })

    const token = signToken(user._id.toString())
    res.status(201).json({
      token,
      user: {
        email: user.email,
        wishlist: user.wishlist,
        trips: user.trips,
      },
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Registration failed' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase()
    const password = String(req.body?.password || '')

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = signToken(user._id.toString())
    res.json({
      token,
      user: {
        email: user.email,
        wishlist: user.wishlist,
        trips: user.trips,
      },
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Login failed' })
  }
})

app.get('/api/auth/me', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash')
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json({
      user: {
        email: user.email,
        wishlist: user.wishlist,
        trips: user.trips,
      },
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to load profile' })
  }
})

app.put('/api/auth/me', authRequired, async (req, res) => {
  try {
    const wishlist = req.body?.wishlist
    const trips = req.body?.trips

    if (!Array.isArray(wishlist) || !Array.isArray(trips)) {
      return res
        .status(400)
        .json({ error: 'Body must include wishlist and trips arrays' })
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { wishlist, trips } },
      { new: true }
    ).select('-passwordHash')

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      user: {
        email: user.email,
        wishlist: user.wishlist,
        trips: user.trips,
      },
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to save data' })
  }
})

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('Missing MONGODB_URI in environment (.env)')
    process.exit(1)
  }

  await mongoose.connect(uri)
  console.log('MongoDB connected')

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
