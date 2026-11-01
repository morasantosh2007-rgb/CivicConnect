import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.jsx'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '')
if (apiBaseUrl) {
  axios.defaults.baseURL = apiBaseUrl
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
