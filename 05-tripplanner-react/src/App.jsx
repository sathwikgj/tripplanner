import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import PersistRedux from './components/PersistRedux'
import SyncUserData from './components/SyncUserData'
import Compare from './pages/Compare'
import CountryDetail from './pages/CountryDetail'
import Explore from './pages/Explore'
import Itinerary from './pages/Itinerary'
import Login from './pages/Login'
import Planner from './pages/Planner'
import Register from './pages/Register'
import Booking from './pages/Booking'
import Wishlist from './pages/Wishlist'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <PersistRedux />
      <SyncUserData />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Explore />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/itinerary" element={<Itinerary />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/country/:cca3" element={<CountryDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
