/**
 * Login-map KMZ/KML visibility.
 * In-memory for now; mirrored to localStorage so logout/login keeps the choice.
 * Replace persistence with an API later when backend is ready.
 */
const STORAGE_KEY = 'scadaweb.login-layer-visible'

let loginLayerVisible = true

function readStored(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return true
    return raw === 'true'
  } catch {
    return true
  }
}

loginLayerVisible = readStored()

type Listener = (visible: boolean) => void
const listeners = new Set<Listener>()

export function getLoginLayerVisible() {
  return loginLayerVisible
}

export function setLoginLayerVisible(visible: boolean) {
  if (loginLayerVisible === visible) return
  loginLayerVisible = visible
  try {
    localStorage.setItem(STORAGE_KEY, String(visible))
  } catch {
    // Ignore private mode / quota errors; in-memory value still applies.
  }
  listeners.forEach((listener) => listener(visible))
}

export function subscribeLoginLayerVisible(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
