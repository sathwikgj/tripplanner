# TripPlanner — React SPA

This folder contains a **single-page application (SPA)** version of the original static TripPlanner site (`../05-tripplanner/`). The UI uses **React**, **React Router**, **Redux**, hooks (**`useState`**, **`useEffect`**), and optional **accounts** backed by **MongoDB** (see `server/`).

---

## Browser storage: what we use and why

### `sessionStorage` (Explore / country list cache)

**What it is:** A key–value store in the browser, **scoped to one tab**. It clears when that tab is closed (unlike `localStorage`, which survives browser restarts).

**How we use it** (`src/api/countries.js`):

- After the first successful fetch of all countries, we save the JSON under a key like `tripplanner_explore_countries_v1`.
- On the next visit **in the same tab**, we read that cache **synchronously** so the Explore grid can render without waiting on the network.
- We also keep a **stale-while-revalidate** behavior: if the cache is old, we still show the last list while refreshing in the background.

**Why it helps:** The REST Countries `all` endpoint returns a large payload; caching avoids repeated 1–3 s waits when navigating back to Home.

---

### `localStorage` (guest wishlist, trips, and auth token)

**What it is:** A key–value store that **persists** across sessions until the user clears site data.

**How we use it:**

| Key | Purpose |
|-----|---------|
| `wishlist` | Guest mode: array of wishlist countries (JSON). |
| `tripplanner_trips` | Guest mode: saved trips (JSON). |
| `tripplanner_token` | Logged-in **JWT** returned by our API after login/register. |
| `tripplanner_guest_wishlist_backup` / `tripplanner_guest_trips_backup` | **SessionStorage** backups of guest data taken **when you log in**, so **Log out** can restore the previous guest session. |

**Logged-in users:** Wishlist and trips are stored in **MongoDB** on the server. `PersistRedux.jsx` does **not** write wishlist/trips to `localStorage` while you are logged in (so another user on the same machine does not see your data in those keys). Changes are debounced to the API via `SyncUserData.jsx`.

**Guests:** Redux is synced to `wishlist`/`tripplanner_trips` so data survives refresh without an account.

---

### Redux, `useEffect`, and persistence (summary)

- **Redux** holds wishlist + trips in memory for the whole app.
- **Guest:** `PersistRedux` uses **`useEffect`** to mirror Redux → `localStorage`.
- **Logged in:** `SyncUserData` uses **`useEffect`** + debounce to send Redux → `PUT /api/auth/me` → MongoDB.
- **Logout** flushes the latest server state to the API (best effort), clears the token, then restores guest Redux from the backup in `sessionStorage`.

---

## Backend: login and MongoDB

The **`server/`** folder is a small **Express** API that:

- Registers and logs in users with **bcrypt** password hashes and **JWT** tokens.
- Stores **per-user** `wishlist` and `trips` arrays on a **MongoDB** `User` document (`server/models/User.js`).

Each user only sees their own data after login; MongoDB is the source of truth for accounts.

**Detailed walkthrough (connection string, collections, each API step, JWT → user id, how PUT updates documents):** see **[`docs/MONGODB.md`](docs/MONGODB.md)**.

---

## Run locally (React only — no database)

If you only want the UI without accounts:

```bash
cd 05-tripplanner-react
npm install
npm run dev
```

Open `http://localhost:5173`. Register/login will **fail** until the API and MongoDB are running.

---

## “Bad gateway” (502) when registering or logging in

That almost always means **Vite’s proxy** (`/api` → `http://localhost:5000`) could not reach the **Node API** — usually because:

1. **The API is not running** — start it in a second terminal: `npm run dev:api` (from `05-tripplanner-react`), or use **`npm run dev:all`** once (see below) to run Vite + API together.
2. **The API failed to start** — e.g. missing `server/.env` or invalid `MONGODB_URI`. Check the terminal running the server for `MongoDB connected` and `API listening on http://localhost:5000`.

Register/login call `POST /api/auth/...`; the browser only talks to Vite (`5173`), which forwards to port **5000**.

---

## Run locally (React + API + MongoDB)

You need **two terminals** (or **`npm run dev:all`** once) and a **MongoDB connection string** (local MongoDB or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)).

### One command: Vite + API together

After `server/.env` is configured:

```bash
cd 05-tripplanner-react
npm install
npm run dev:all
```

This runs the React dev server and **server** together. You still need MongoDB reachable via `MONGODB_URI`.

### 1) Create Atlas cluster (or use local MongoDB)

1. Sign in at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a **free** cluster and a **database user** (username + password).
3. Under **Network Access**, add your IP (or `0.0.0.0/0` for development only).
4. Click **Connect** → **Drivers** and copy the **connection string** (replace `<password>` with your user’s password).
5. Append a database name, e.g. `...mongodb.net/tripplanner?retryWrites=true&w=majority`.

### 2) Configure the API

```bash
cd 05-tripplanner-react/server
npm install
```

Copy `server/.env.example` to `server/.env` and set:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/tripplanner?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-string
```

Optional:

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

Start the API:

```bash
npm run dev
```

You should see `MongoDB connected` and `API listening on http://localhost:5000`.

### 3) Start the React app

In another terminal:

```bash
cd 05-tripplanner-react
npm install
npm run dev
```

`vite.config.js` **proxies** `/api` to `http://localhost:5000`, so the browser calls `/api/auth/...` without CORS issues during development.

### 4) Test accounts

1. Open `http://localhost:5173/register`, create an account.
2. Add wishlist items and trips; wait a second after edits (debounced save).
3. **Log out**, log in as **another** user — you should see **empty** data until they add their own.
4. Log back in as the first user — their wishlist and trips should load from MongoDB.

---

## Production deployment (checklist)

1. **Deploy the API** (Node host) with `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_ORIGIN` set to your real front-end origin(s).
2. **Build the React app** (`npm run build`) and host `dist/` on static hosting or the same origin as the API.
3. Set **`VITE_API_URL`** at build time to your API’s public origin if the API is **not** same-origin (see `.env.example`). If the API and SPA share the same domain and path prefix, you can leave it empty and use a reverse proxy.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server (React) |
| `npm run dev:api` | API with watch (`server/`) |
| `npm run build` | Production bundle |
| `npm run preview` | Preview production build |

---

## What changed from the original static project

| Before (static site) | After (this app) |
|----------------------|------------------|
| Multiple HTML files | One SPA; **React Router** routes (`/`, `/wishlist`, `/country/FRA`, `/login`, …) |
| Vanilla JS | React components under `src/pages/` |
| Wishlist only in `localStorage` | Guests: `localStorage`; **logged-in: MongoDB** + JWT |
| Country detail stub | **`/country/:cca3`** loads REST Countries |

---

## React concepts in *this* application

### Redux

- **Wishlist** and **trips** slices are shared across Explore, Wishlist, Planner, Country Detail, etc.
- **`hydrateWishlist` / `hydrateTrips`** load data from the API after login or when restoring guest data.

### `useState`

Used for **screen-local** UI: search filters, compare selects, planner form fields, country detail loading/error.

### `useEffect`

Used for **fetching** (Explore, Compare, country page), **persisting** guest data (`PersistRedux`), **syncing** to MongoDB (`SyncUserData`), and **loading the session** (`AuthContext`).

---

## Project layout

```
05-tripplanner-react/
├── server/                 # Express + MongoDB API
│   ├── index.js
│   ├── models/User.js
│   ├── middleware/auth.js
│   └── .env.example
├── src/
│   ├── api/                # client.js, authApi.js, countries.js
│   ├── context/            # AuthContext (login, session)
│   ├── components/         # Navbar, PersistRedux, SyncUserData, …
│   ├── pages/              # Explore, Login, Register, …
│   ├── store/              # Redux slices
│   ├── App.jsx
│   └── main.jsx
├── vite.config.js          # dev proxy /api → localhost:5000
└── package.json
```

## Country data (REST Countries via our API)

The **browser does not call REST Countries directly**. The React app only requests **`/api/countries/*`** on your Node server (`server/routes/countries.js`). The server fetches from **[REST Countries](https://restcountries.com/)** and returns JSON.

| Route | Purpose |
|--------|---------|
| `GET /api/countries/all` | Explore grid (fields: name, capital, region, population, flags, cca3, area) |
| `GET /api/countries/codes` | Compare dropdowns (name + cca3) |
| `GET /api/countries/alpha/:cca3` | Single country (detail page) |
| `GET /api/countries/batch?codes=A,B,C` | Compare table (multiple countries in one request) |

In production, set **`VITE_API_URL`** to your API origin if the SPA and API are on different hosts.

---

## Relationship to `05-tripplanner/`

The original static HTML/JS site is unchanged; this React app lives **next to it** for comparison.
