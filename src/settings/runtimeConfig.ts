/**
 * Cấu hình bí mật / endpoint — không hardcode trong mã nguồn (feature 4.4).
 * Thứ tự: giao diện cấu hình (localStorage) → biến môi trường (.env).
 */
export type RuntimeConfig = {
  apiBaseUrl: string
  arcgisApiKey: string
}

export type RuntimeConfigSource = {
  apiBaseUrl: 'ui' | 'env' | 'default'
  arcgisApiKey: 'ui' | 'env' | 'none'
}

const STORAGE_KEY = 'scadaweb.runtime-config'

const DEFAULT_API_BASE_URL = 'http://localhost:5140/api/v1'

type StoredConfig = Partial<RuntimeConfig>

function envApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '').trim() ?? ''
}

function envArcgisApiKey() {
  return import.meta.env.VITE_ARCGIS_API_KEY?.trim() ?? ''
}

function readStored(): StoredConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as StoredConfig
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStored(value: StoredConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Ignore private mode / quota errors.
  }
}

type Listener = (next: RuntimeConfig) => void
const listeners = new Set<Listener>()

function notify() {
  const next = getRuntimeConfig()
  listeners.forEach((listener) => listener(next))
}

export function getRuntimeConfig(): RuntimeConfig {
  const stored = readStored()
  return {
    apiBaseUrl: stored.apiBaseUrl?.trim() || envApiBaseUrl() || DEFAULT_API_BASE_URL,
    arcgisApiKey: stored.arcgisApiKey?.trim() || envArcgisApiKey(),
  }
}

export function getRuntimeConfigSource(): RuntimeConfigSource {
  const stored = readStored()
  return {
    apiBaseUrl: stored.apiBaseUrl?.trim()
      ? 'ui'
      : envApiBaseUrl()
        ? 'env'
        : 'default',
    arcgisApiKey: stored.arcgisApiKey?.trim() ? 'ui' : envArcgisApiKey() ? 'env' : 'none',
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

export function setRuntimeConfig(patch: StoredConfig) {
  const current = readStored()
  const next: StoredConfig = { ...current }
  if (patch.apiBaseUrl !== undefined) {
    const trimmed = patch.apiBaseUrl.trim().replace(/\/$/, '')
    if (trimmed) next.apiBaseUrl = trimmed
    else delete next.apiBaseUrl
  }
  if (patch.arcgisApiKey !== undefined) {
    const trimmed = patch.arcgisApiKey.trim()
    if (trimmed) next.arcgisApiKey = trimmed
    else delete next.arcgisApiKey
  }
  writeStored(next)
  notify()
}

export function subscribeRuntimeConfig(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
