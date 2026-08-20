import { DEFAULT_LAYER_STYLE } from '@/components/map/layerTypes'

/** Style + identity metadata persisted with each KMZ/KML. */
export type MapLayerMeta = {
  id: string
  name: string
  fileName: string
  opacity: number
  weight: number
  visible: boolean
  color: string
}

/** API payload for a single map layer (real backend). */
export type MapLayerDto = {
  id: string
  meta: MapLayerMeta
  /** Absolute or API-relative URL to download the file */
  fileUrl: string
}

export type MapLayerPackage = {
  meta: MapLayerMeta
  file: File
  /** Remote URL to the KMZ/KML (used when `file` is a deferred stub). */
  fileUrl?: string
  /** Parsed geometry cache (skip KMZ unzip on reload when present) */
  geojson?: import('geojson').FeatureCollection
  /** Static base for embedded KMZ images (`/map-layers/{id}/`) */
  mediaBaseUrl?: string
}

/** @deprecated Use MapLayerPackage — kept for gradual rename */
export type ActiveMapLayerPackage = MapLayerPackage

/** @deprecated Use MapLayerDto */
export type ActiveMapLayerDto = MapLayerDto

export function createMapLayerId(): string {
  return `layer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function defaultMapLayerMeta(
  fileName: string,
  options?: { id?: string; name?: string },
): MapLayerMeta {
  return {
    id: options?.id ?? createMapLayerId(),
    name: options?.name || fileName.replace(/\.(kml|kmz)$/i, '') || 'Lớp mới',
    fileName,
    opacity: DEFAULT_LAYER_STYLE.opacity,
    weight: DEFAULT_LAYER_STYLE.weight,
    visible: true,
    color: DEFAULT_LAYER_STYLE.color,
  }
}

/** Storage backend used by the map-layer service. */
export type MapLayerStorageMode = 'files' | 'mock' | 'api'
