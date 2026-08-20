import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { resolveMapLayers } from './services/mapLayers'
import './styles/index.css'

// Warm map layers from disk as early as possible (geojson, not full KMZ).
void resolveMapLayers()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
