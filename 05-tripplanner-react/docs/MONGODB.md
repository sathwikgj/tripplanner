# How TripPlanner Works With MongoDB

This document explains **step by step** how the React app, the Node API, and **MongoDB** work together: what gets stored where, when reads and writes happen, and how users stay isolated from each other.

---

## 1. Big picture

```mermaid
flowchart LR
  subgraph browser [Browser]
    React[React + Redux]
    LS[localStorage JWT]
  end
  subgraph api [Node server]
    Express[Express routes]
    JWT[JWT verify]
  end
  subgraph mongo [MongoDB Atlas or local]
    DB[(Database)]
    Users[users collection]
  end
  React -->|HTTPS JSON| Express
  Express --> JWT
  Express -->|Mongoose| Users
  Users --> DB
  React --> LS
```

- **MongoDB** holds **one document per registered user**: email, password hash, wishlist array, trips array.
- The **browser never talks to MongoDB directly**. It only talks to **your Express API**.
- The API uses **Mongoose** to connect to MongoDB using `MONGODB_URI` from `server/.env`.

---

## 2. Connection to MongoDB (server startup)

**Where:** `server/index.js`

1. The process loads environment variables (including `MONGODB_URI` and `JWT_SECRET`) via `dotenv`.
2. `mongoose.connect(MONGODB_URI)` opens a connection pool to your cluster (e.g. Atlas) or local MongoDB.
3. If the URI is missing, the server exits with an error (no database, no API).
4. After a successful connect, Express starts listening on `PORT` (default `5000`).

**What you configure:** In Atlas, the URI looks like:

`mongodb+srv://USER:PASSWORD@cluster.xxxxx.mongodb.net/tripplanner?retryWrites=true&w=majority`

The path segment (`tripplanner`) is the **database name** MongoDB will use. Collections are created automatically when you first insert data (see below).

---

## 3. What is stored in MongoDB (the `User` document)

**Where:** `server/models/User.js`

Mongoose maps the model name `User` to a collection named **`users`** (lowercase, plural by default).

Each document looks like this conceptually:

| Field | Purpose |
|--------|---------|
| `_id` | MongoDB ObjectId (primary key for the user). |
| `email` | Unique login identifier (stored lowercase). |
| `passwordHash` | **Not** the plain password. It is a **bcrypt** hash created at registration / compared at login. |
| `wishlist` | Array of embedded subdocuments: `cca3`, `name`, `capital`, `region`, `population`, `area`, `flag`. |
| `trips` | Array of embedded subdocuments: `id`, `title`, `countryCode`, `startDate`, `endDate`, `notes`, `createdAt`. |

**Important:** Country facts from **REST Countries** (flags, population, etc.) are **not** stored as separate Mongo collections in this app. Only the **wishlist/trip snapshots** the user saved are in MongoDB. Explore/Compare still fetch live data from the public REST Countries API.

---

## 4. Registration: how a user row is created

**Endpoint:** `POST /api/auth/register`  
**Where:** `server/index.js`

Steps:

1. The client sends JSON: `{ "email": "...", "password": "..." }`.
2. The server validates email/password (password length ≥ 6).
3. It checks **`User.findOne({ email })`**. If a document exists → **409** (email already registered).
4. It computes **`passwordHash = await bcrypt.hash(password, 10)`** and never stores the plain password.
5. It runs **`User.create({ email, passwordHash })`**. Mongoose inserts **one new document** in the `users` collection with **empty** `wishlist` and `trips` arrays.
6. It creates a **JWT** with payload `{ sub: user._id }` (see middleware) and returns `{ token, user: { email, wishlist, trips } }`.
7. The React app saves `token` in **`localStorage`** under `tripplanner_token` and puts wishlist/trips into **Redux**.

From this moment, that user’s MongoDB document is identified by `_id`, which is what the JWT refers to as `sub`.

---

## 5. Login: how MongoDB is read (no new document)

**Endpoint:** `POST /api/auth/login`

Steps:

1. **`User.findOne({ email })`** loads the matching document (including `passwordHash`).
2. If no user → **401**.
3. **`bcrypt.compare(password, user.passwordHash)`** checks the password. If false → **401**.
4. A new **JWT** is issued (same shape as register) with `sub: user._id`.
5. Response includes **`wishlist` and `trips` from that document** so the client can hydrate Redux immediately.

So **login** is: read user from MongoDB → verify password → return token + stored arrays.

---

## 6. JWT: how the API knows *which* MongoDB user to use

**Where:** `server/middleware/auth.js`

1. The client sends **`Authorization: Bearer <token>`** on protected routes.
2. The server verifies the JWT with **`JWT_SECRET`** (must match the secret used when signing).
3. The payload contains **`sub`**, which is the user’s **`_id` string** from MongoDB.
4. **`req.userId`** is set to that value for the route handler.

So every authenticated request is tied to **exactly one** user document. There is no “guess the user id from the body” for protected routes; it comes from the token.

---

## 7. Loading profile after refresh: `GET /api/auth/me`

**Endpoint:** `GET /api/auth/me` (requires valid JWT)

Steps:

1. **`authRequired`** runs → `req.userId` is set from the token.
2. **`User.findById(req.userId).select('-passwordHash')`** loads the user document **without** returning the hash to the client.
3. Response: `{ user: { email, wishlist, trips } }`.

The React **`AuthContext`** runs this on app load if `tripplanner_token` exists, so after a full page refresh the UI reloads the latest wishlist/trips from MongoDB.

---

## 8. Saving wishlist and trips: `PUT /api/auth/me`

**Endpoint:** `PUT /api/auth/me` (requires valid JWT)  
**Body:** `{ "wishlist": [ ... ], "trips": [ ... ] }`

Steps:

1. **`authRequired`** → `req.userId`.
2. Validate that **`wishlist` and `trips` are arrays**.
3. **`User.findByIdAndUpdate(req.userId, { $set: { wishlist, trips } }, { new: true })`** replaces the **entire** `wishlist` and `trips` arrays on that user document with the JSON sent from the client.
4. Returns the updated user (without `passwordHash`).

So MongoDB always stores the **full current lists** for that user, not individual “patch” operations per button click.

**React side:** `src/components/SyncUserData.jsx` watches Redux and, after a short **debounce** (~600 ms), sends the current wishlist + trips. That reduces how many writes hit MongoDB while the user is clicking quickly.

---

## 9. End-to-end flow: edit wishlist while logged in

1. User clicks “heart” on Explore → Redux updates (`wishlistSlice`).
2. **`PersistRedux`** does **not** write wishlist to `localStorage` while logged in (so another account on the same browser is not mixed into guest keys).
3. After debounce, **`SyncUserData`** calls **`PUT /api/auth/me`** with the new arrays.
4. Express updates **only** the document where `_id === req.userId`.
5. Another user, with a different JWT, has a **different** `req.userId` → **different document** in the `users` collection.

That is how “user A’s data” and “user B’s data” stay separate in MongoDB.

---

## 10. Logout and MongoDB

- **Before clearing the session**, the client can call **`PUT /api/auth/me`** one last time (the app attempts this in **`logout`**) so the latest Redux state is flushed to MongoDB.
- The JWT is removed from `localStorage`; the **document in MongoDB is unchanged** except for what was already saved by previous PUTs.
- When the user **logs in again**, **`POST /api/auth/login`** reads the same document and returns the stored wishlist/trips.

---

## 11. What MongoDB does *not* do in this project

| Topic | Where it lives |
|--------|----------------|
| Full country catalog (250+ countries) | **REST Countries API** (HTTP from the browser). |
| Explore page speed cache | **`sessionStorage`** in the browser (`src/api/countries.js`). |
| Guest wishlist/trips without an account | **`localStorage`** in the browser, not MongoDB. |

MongoDB is only for **registered users’** wishlists and trips (plus auth fields).

---

## 12. Quick reference: files to read

| File | Role |
|------|------|
| `server/index.js` | Connect to MongoDB, define HTTP routes, bcrypt + JWT responses. |
| `server/models/User.js` | Schema for `users` collection. |
| `server/middleware/auth.js` | Sign and verify JWT; attach `userId`. |
| `src/context/AuthContext.jsx` | Login/register/me/logout, hydrate Redux. |
| `src/components/SyncUserData.jsx` | Debounced `PUT /api/auth/me`. |
| `src/api/authApi.js` | `fetch` helpers for `/api/auth/...`. |

---

## 13. Verifying in Atlas (optional)

After registering a user:

1. Open your cluster in **Atlas → Browse Collections**.
2. Open database **`tripplanner`** (or whatever name is in your URI).
3. Open collection **`users`**.
4. You should see one document per account, with `email`, `passwordHash`, `wishlist`, and `trips`.

You should **not** see plain-text passwords—only the bcrypt hash.

---

For environment variables and first-time setup (URI, `JWT_SECRET`, running the API and React together), see the main **`README.md`** in the project root.
