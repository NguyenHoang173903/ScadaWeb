import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import { fetchFrontendConfig } from './services/frontendConfig/frontendConfigApi'
import { queryClient } from './services/queryClient'
import { resolveMapLayers } from './services/mapLayers'
import { setLoginLayerVisible } from './settings/loginLayerSettings'
import { applyServerRuntimeConfig } from './settings/runtimeConfig'
import './styles/index.css'

void fetchFrontendConfig()
  .then((config) => {
    applyServerRuntimeConfig({ arcgisApiKey: config.arcgisApiKey })
    setLoginLayerVisible(config.loginLayerVisible)
  })
  .catch(() => {
    // Deployment environment defaults remain active when BE is unavailable.
  })

// Warm map layers from disk as early as possible (geojson, not full KMZ).
void resolveMapLayers()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
