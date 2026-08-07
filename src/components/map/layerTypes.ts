import type { FeatureCollection } from 'geojson'

export type MapOverlayLayer = {
  id: string
  name: string
  geojson: FeatureCollection
  visible: boolean
  /** 0–1 */
  opacity: number
  /** 1–8 */
  weight: number
  color: string
  /** Base URL for static public assets (`files/...`) */
  mediaBaseUrl?: string
  /** Blob URLs extracted from an uploaded KMZ */
  mediaUrls?: Record<string, string>
  /** Object URLs to revoke when this layer is replaced/removed */
  objectUrls?: string[]
}

export const DEFAULT_CANAL_LAYER_ID = 'layer-hethongkenh'

export const DEFAULT_LAYER_STYLE = {
  opacity: 1,
  /** 20% of max weight (8) → 1.6 */
  weight: 1.6,
  color: '#2D7DD2',
} as const
