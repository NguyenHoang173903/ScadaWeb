import { DEFAULT_LAYER_STYLE } from '@/components/map/layerTypes'

/** Style + identity metadata persisted with the active KMZ/KML. */
export type MapLayerMeta = {
  name: string
  fileName: string
  opacity: number
  weight: number
  visible: boolean
  color: string
}

/** API payload for GET /map-layers/active (real backend). */
export type ActiveMapLayerDto = {
  meta: MapLayerMeta
  /** Absolute or API-relative URL to download the file */
  fileUrl: string
}

export type ActiveMapLayerPackage = {
  meta: MapLayerMeta
  file: File
}

export function defaultMapLayerMeta(fileName: string, name?: string): MapLayerMeta {
  return {
    name: name || fileName.replace(/\.(kml|kmz)$/i, '') || 'Lớp mới',
    fileName,
    opacity: DEFAULT_LAYER_STYLE.opacity,
    weight: DEFAULT_LAYER_STYLE.weight,
    visible: true,
    color: DEFAULT_LAYER_STYLE.color,
  }
}

/** Storage backend used by the map-layer service. */
export type MapLayerStorageMode = 'mock' | 'api'
