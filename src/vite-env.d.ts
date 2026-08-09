/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_ARCGIS_API_KEY?: string
  /** `mock` (default) | `api` — map KMZ storage backend */
  readonly VITE_MAP_LAYER_STORAGE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.svg?raw' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}
