/**
 * API endpoint is bootstrap configuration from the FE deployment environment.
 * ArcGIS browser key can be loaded from the shared backend configuration.
 */
export type RuntimeConfig = {
  apiBaseUrl: string
  arcgisApiKey: string
  dashboardMapZoom: number
  dashboardMapOffsetX: number
  dashboardMapOffsetY: number
}

export type RuntimeConfigSource = {
  apiBaseUrl: 'env' | 'default'
  arcgisApiKey: 'server' | 'env' | 'none'
}

export type DashboardMapView = {
  zoom: number
  offsetX: number
  offsetY: number
}

const DEFAULT_API_BASE_URL = 'http://localhost:5140/api/v1'
let serverArcgisApiKey = ''
let serverDashboardMapView = {
  zoom: 2,
  offsetX: 0,
  offsetY: 0,
}
let currentDashboardMapView: DashboardMapView | null = null

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
    dashboardMapZoom: serverDashboardMapView.zoom,
    dashboardMapOffsetX: serverDashboardMapView.offsetX,
    dashboardMapOffsetY: serverDashboardMapView.offsetY,
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

export function setCurrentDashboardMapView(view: DashboardMapView) {
  currentDashboardMapView = { ...view }
}

export function getCurrentDashboardMapView() {
  return currentDashboardMapView ? { ...currentDashboardMapView } : null
}

export function applyServerRuntimeConfig(config: {
  arcgisApiKey?: string | null
  dashboardMapZoom?: number | null
  dashboardMapOffsetX?: number | null
  dashboardMapOffsetY?: number | null
}) {
  serverArcgisApiKey = config.arcgisApiKey?.trim() ?? ''
  serverDashboardMapView = {
    zoom:
      typeof config.dashboardMapZoom === 'number' &&
      config.dashboardMapZoom >= 1 &&
      config.dashboardMapZoom <= 4
        ? config.dashboardMapZoom
        : 2,
    offsetX:
      typeof config.dashboardMapOffsetX === 'number'
        ? config.dashboardMapOffsetX
        : 0,
    offsetY:
      typeof config.dashboardMapOffsetY === 'number'
        ? config.dashboardMapOffsetY
        : 0,
  }
  notify()
}

export function subscribeRuntimeConfig(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
