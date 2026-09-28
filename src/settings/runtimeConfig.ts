/**
 * API endpoint is bootstrap configuration from the FE deployment environment.
 * ArcGIS browser key can be loaded from the shared backend configuration.
 */
export type RuntimeConfig = {
  apiBaseUrl: string
  arcgisApiKey: string
}

export type RuntimeConfigSource = {
  apiBaseUrl: 'env' | 'default'
  arcgisApiKey: 'server' | 'env' | 'none'
}

const DEFAULT_API_BASE_URL = 'http://localhost:5140/api/v1'
let serverArcgisApiKey = ''

function envApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '').trim() ?? ''
}

function envArcgisApiKey() {
  return import.meta.env.VITE_ARCGIS_API_KEY?.trim() ?? ''
}

type Listener = (next: RuntimeConfig) => void
const listeners = new Set<Listener>()

function notify() {
  const next = getRuntimeConfig()
  listeners.forEach((listener) => listener(next))
}

export function getRuntimeConfig(): RuntimeConfig {
  return {
    apiBaseUrl: envApiBaseUrl() || DEFAULT_API_BASE_URL,
    arcgisApiKey: serverArcgisApiKey || envArcgisApiKey(),
  }
}

export function getRuntimeConfigSource(): RuntimeConfigSource {
  return {
    apiBaseUrl: envApiBaseUrl() ? 'env' : 'default',
    arcgisApiKey: serverArcgisApiKey ? 'server' : envArcgisApiKey() ? 'env' : 'none',
  }
}

export function getApiBaseUrl() {
  return getRuntimeConfig().apiBaseUrl.replace(/\/$/, '')
}

/** Origin for SignalR hubs (`/hubs/scada`), derived from API base. */
export function getApiOrigin() {
  return getApiBaseUrl().replace(/\/api\/v1$/i, '').replace(/\/api$/i, '')
}

export function getArcgisApiKey() {
  return getRuntimeConfig().arcgisApiKey
}

export function applyServerRuntimeConfig(config: { arcgisApiKey?: string | null }) {
  serverArcgisApiKey = config.arcgisApiKey?.trim() ?? ''
  notify()
}

export function subscribeRuntimeConfig(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
