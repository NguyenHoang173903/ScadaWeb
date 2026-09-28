let loginLayerVisible = true

type Listener = (visible: boolean) => void
const listeners = new Set<Listener>()

export function getLoginLayerVisible() {
  return loginLayerVisible
}

export function setLoginLayerVisible(visible: boolean) {
  if (loginLayerVisible === visible) return
  loginLayerVisible = visible
  listeners.forEach((listener) => listener(visible))
}

export function subscribeLoginLayerVisible(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
