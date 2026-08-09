import {
  DEFAULT_CANAL_LAYER_ID,
  type MapOverlayLayer,
} from '@/components/map/layerTypes'
import { importLayerPackage } from '@/components/map/parseLayerFile'
import {
  apiDeleteActiveMapLayer,
  apiGetActiveMapLayer,
  apiUpdateActiveMapLayerMeta,
  apiUploadActiveMapLayer,
} from './mapLayerApi'
import {
  clearCachedActiveMapLayer,
  getCachedActiveMapLayer,
  patchCachedActiveMapLayerMeta,
  setCachedActiveMapLayer,
  snapshotCachedOverlay,
} from './mapLayerCache'
import {
  mockDeleteActiveMapLayer,
  mockGetActiveMapLayer,
  mockUpdateActiveMapLayerMeta,
  mockUploadActiveMapLayer,
} from './mapLayerMock'
import {
  defaultMapLayerMeta,
  type ActiveMapLayerPackage,
  type MapLayerMeta,
  type MapLayerStorageMode,
} from './types'

/** `mock` (default) until real uploads/map-layers API is available. */
export function getMapLayerStorageMode(): MapLayerStorageMode {
  const raw = import.meta.env.VITE_MAP_LAYER_STORAGE?.trim().toLowerCase()
  return raw === 'api' ? 'api' : 'mock'
}

async function getActivePackage(): Promise<ActiveMapLayerPackage | null> {
  return getMapLayerStorageMode() === 'api'
    ? apiGetActiveMapLayer()
    : mockGetActiveMapLayer()
}

async function buildOverlay(pack: ActiveMapLayerPackage): Promise<MapOverlayLayer> {
  const imported = await importLayerPackage(pack.file)
  return {
    id: DEFAULT_CANAL_LAYER_ID,
    name: pack.meta.name || pack.file.name,
    geojson: imported.geojson,
    visible: pack.meta.visible,
    opacity: pack.meta.opacity,
    weight: pack.meta.weight,
    color: pack.meta.color,
    mediaUrls: imported.mediaUrls,
    objectUrls: imported.objectUrls,
  }
}

/**
 * Load active map layer for Dashboard / Login.
 * Uses in-memory cache after the first parse so route changes stay fast.
 */
export async function resolveActiveMapLayer(): Promise<MapOverlayLayer | null> {
  const cached = getCachedActiveMapLayer()
  if (cached) return snapshotCachedOverlay()

  try {
    const pack = await getActivePackage()
    if (!pack) return null
    const overlay = await buildOverlay(pack)
    setCachedActiveMapLayer(overlay, pack.meta, { replaceFile: true })
    return snapshotCachedOverlay()
  } catch {
    return null
  }
}

/** Persist KMZ/KML and return overlay for the map. */
export async function uploadActiveMapLayer(
  file: File,
  metaOverrides?: Partial<MapLayerMeta>,
): Promise<MapOverlayLayer> {
  const meta: MapLayerMeta = {
    ...defaultMapLayerMeta(file.name),
    ...metaOverrides,
    fileName: file.name,
  }

  const pack =
    getMapLayerStorageMode() === 'api'
      ? await apiUploadActiveMapLayer(file, meta)
      : await mockUploadActiveMapLayer(file, meta)

  const overlay = await buildOverlay(pack)
  setCachedActiveMapLayer(overlay, pack.meta, { replaceFile: true })
  return snapshotCachedOverlay()!
}

export async function updateActiveMapLayerMeta(
  patch: Partial<MapLayerMeta>,
): Promise<void> {
  patchCachedActiveMapLayerMeta(patch)
  if (getMapLayerStorageMode() === 'api') {
    await apiUpdateActiveMapLayerMeta(patch)
  } else {
    await mockUpdateActiveMapLayerMeta(patch)
  }
}

export async function deleteActiveMapLayer(): Promise<void> {
  clearCachedActiveMapLayer()
  if (getMapLayerStorageMode() === 'api') {
    await apiDeleteActiveMapLayer()
  } else {
    await mockDeleteActiveMapLayer()
  }
}

export type { MapLayerMeta, MapLayerStorageMode }
