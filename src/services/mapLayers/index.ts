import type { MapOverlayLayer } from '@/components/map/layerTypes'
import { importLayerPackage } from '@/components/map/parseLayerFile'
import {
  apiDeleteMapLayer,
  apiListMapLayers,
  apiUpdateMapLayerMeta,
  apiUploadMapLayer,
} from './mapLayerApi'
import {
  clearCachedMapLayers,
  getCachedMapLayers,
  isMapLayerCacheHydrated,
  markMapLayerCacheHydrated,
  patchCachedMapLayerMeta,
  patchCachedMapLayerOverlay,
  removeCachedMapLayer,
  setCachedMapLayer,
  setCachedMapLayers,
} from './mapLayerCache'
import {
  fsDeleteMapLayer,
  fsDownloadLayerFile,
  fsListMapLayers,
  fsUpdateMapLayerMeta,
  fsUploadMapLayer,
} from './mapLayerFs'
import {
  mockDeleteMapLayer,
  mockListMapLayers,
  mockSaveLayerGeojson,
  mockUpdateMapLayerMeta,
  mockUploadMapLayer,
} from './mapLayerMock'
import {
  defaultMapLayerMeta,
  type MapLayerMeta,
  type MapLayerPackage,
  type MapLayerStorageMode,
} from './types'

/**
 * `files` (default) — KMZ on disk under `public/map-layers/` (Vite FS plugin).
 * `mock` — IndexedDB only.
 * `api` — real backend `/map-layers`.
 */
export function getMapLayerStorageMode(): MapLayerStorageMode {
  const raw = import.meta.env.VITE_MAP_LAYER_STORAGE?.trim().toLowerCase()
  if (raw === 'api') return 'api'
  if (raw === 'mock') return 'mock'
  return 'files'
}

async function listPackages(): Promise<MapLayerPackage[]> {
  const mode = getMapLayerStorageMode()
  if (mode === 'api') return apiListMapLayers()
  if (mode === 'mock') return mockListMapLayers()
  return fsListMapLayers()
}

async function ensurePackageFile(pack: MapLayerPackage): Promise<File> {
  if (pack.file.size > 0) return pack.file
  if (pack.fileUrl) {
    return fsDownloadLayerFile(pack.fileUrl, pack.meta.fileName || pack.file.name)
  }
  throw new Error(`Thiếu file lớp bản đồ: ${pack.meta.id}`)
}

async function parseOverlay(pack: MapLayerPackage): Promise<MapOverlayLayer> {
  const file = await ensurePackageFile(pack)
  const imported = await importLayerPackage(file)
  return {
    id: pack.meta.id,
    name: pack.meta.name || file.name,
    geojson: imported.geojson,
    visible: pack.meta.visible,
    opacity: pack.meta.opacity,
    weight: pack.meta.weight,
    color: pack.meta.color,
    mediaBaseUrl: pack.mediaBaseUrl || `/map-layers/${pack.meta.id}/`,
    mediaUrls: imported.mediaUrls,
    objectUrls: imported.objectUrls,
  }
}

/** Fast path: reuse cached GeoJSON (no KMZ unzip). */
function overlayFromCachedGeojson(pack: MapLayerPackage): MapOverlayLayer | null {
  if (!pack.geojson) return null
  return {
    id: pack.meta.id,
    name: pack.meta.name || pack.meta.fileName || pack.file.name,
    geojson: pack.geojson,
    visible: pack.meta.visible,
    opacity: pack.meta.opacity,
    weight: pack.meta.weight,
    color: pack.meta.color,
    mediaBaseUrl: pack.mediaBaseUrl || `/map-layers/${pack.meta.id}/`,
    mediaUrls: {},
    objectUrls: [],
  }
}

async function buildOverlay(pack: MapLayerPackage): Promise<MapOverlayLayer> {
  const cached = overlayFromCachedGeojson(pack)
  if (cached) return cached
  const overlay = await parseOverlay(pack)
  if (getMapLayerStorageMode() === 'mock') {
    void mockSaveLayerGeojson(pack.meta.id, overlay.geojson)
  }
  return overlay
}

/**
 * Optional KMZ media (icons/images). Skipped when file is a deferred stub so
 * reload never re-downloads huge KMZ just for media.
 */
async function hydrateLayerMedia(pack: MapLayerPackage): Promise<void> {
  if (!pack.geojson || pack.file.size === 0) return
  try {
    const imported = await importLayerPackage(pack.file)
    patchCachedMapLayerOverlay(pack.meta.id, {
      mediaUrls: imported.mediaUrls,
      objectUrls: imported.objectUrls,
    })
  } catch {
    // Map geometry already shown; media is optional.
  }
}

/** Snapshot of in-memory layers for sync React state init (SPA navigation). */
export function peekCachedMapLayers(): MapOverlayLayer[] {
  return getCachedMapLayers()
}

let resolveInFlight: Promise<MapOverlayLayer[]> | null = null

/**
 * Load all map layers for Dashboard / Login.
 * `files` mode paints from `geometry.geojson` on disk (no KMZ re-download).
 */
export async function resolveMapLayers(): Promise<MapOverlayLayer[]> {
  if (isMapLayerCacheHydrated()) return getCachedMapLayers()
  if (resolveInFlight) return resolveInFlight

  resolveInFlight = (async () => {
    try {
      const packs = await listPackages()
      if (packs.length === 0) {
        setCachedMapLayers([], { replaceAll: true })
        markMapLayerCacheHydrated()
        return []
      }

      const entries: Array<{ overlay: MapOverlayLayer; meta: MapLayerMeta }> = []
      const needsMedia: MapLayerPackage[] = []

      await Promise.all(
        packs.map(async (pack) => {
          const fromCache = overlayFromCachedGeojson(pack)
          if (fromCache) {
            entries.push({ overlay: fromCache, meta: pack.meta })
            needsMedia.push(pack)
            return
          }
          const overlay = await buildOverlay(pack)
          entries.push({ overlay, meta: pack.meta })
        }),
      )

      // Keep manifest order.
      const byId = new Map(entries.map((entry) => [entry.meta.id, entry]))
      const ordered = packs
        .map((pack) => byId.get(pack.meta.id))
        .filter((entry): entry is { overlay: MapOverlayLayer; meta: MapLayerMeta } => Boolean(entry))

      setCachedMapLayers(ordered, { replaceAll: true })
      markMapLayerCacheHydrated()

      if (needsMedia.length > 0) {
        void Promise.all(needsMedia.map((pack) => hydrateLayerMedia(pack)))
      }

      return getCachedMapLayers()
    } catch {
      // Do not mark hydrated on failure — allow retry on next call.
      return getCachedMapLayers()
    } finally {
      resolveInFlight = null
    }
  })()

  return resolveInFlight
}

/** Persist a new KMZ/KML and return its overlay (existing layers stay). */
export async function uploadMapLayer(
  file: File,
  metaOverrides?: Partial<MapLayerMeta>,
): Promise<MapOverlayLayer> {
  const meta: MapLayerMeta = {
    ...defaultMapLayerMeta(file.name),
    ...metaOverrides,
    fileName: file.name,
  }

  const overlay = await parseOverlay({ file, meta })
  const mode = getMapLayerStorageMode()

  if (mode === 'api') {
    await apiUploadMapLayer(file, meta)
  } else if (mode === 'mock') {
    await mockUploadMapLayer(file, meta, overlay.geojson)
  } else {
    await fsUploadMapLayer(file, meta, overlay.geojson)
  }

  setCachedMapLayer(overlay, meta, { replaceFile: true })
  return { ...overlay }
}

export async function updateMapLayerMeta(
  id: string,
  patch: Partial<MapLayerMeta>,
): Promise<void> {
  patchCachedMapLayerMeta(id, patch)
  const mode = getMapLayerStorageMode()
  if (mode === 'api') {
    await apiUpdateMapLayerMeta(id, patch)
  } else if (mode === 'mock') {
    await mockUpdateMapLayerMeta(id, patch)
  } else {
    await fsUpdateMapLayerMeta(id, patch)
  }
}

export async function deleteMapLayer(id: string): Promise<void> {
  removeCachedMapLayer(id)
  const mode = getMapLayerStorageMode()
  if (mode === 'api') {
    await apiDeleteMapLayer(id)
  } else if (mode === 'mock') {
    await mockDeleteMapLayer(id)
  } else {
    await fsDeleteMapLayer(id)
  }
}

/** @deprecated Prefer resolveMapLayers — returns first layer for compatibility. */
export async function resolveActiveMapLayer(): Promise<MapOverlayLayer | null> {
  const layers = await resolveMapLayers()
  return layers[0] ?? null
}

/** @deprecated Prefer uploadMapLayer */
export async function uploadActiveMapLayer(
  file: File,
  metaOverrides?: Partial<MapLayerMeta>,
): Promise<MapOverlayLayer> {
  return uploadMapLayer(file, metaOverrides)
}

/** @deprecated Prefer updateMapLayerMeta(id, patch) */
export async function updateActiveMapLayerMeta(
  patch: Partial<MapLayerMeta>,
): Promise<void> {
  const layers = getCachedMapLayers()
  const id = layers[0]?.id
  if (!id) return
  await updateMapLayerMeta(id, patch)
}

/** @deprecated Prefer deleteMapLayer(id) */
export async function deleteActiveMapLayer(): Promise<void> {
  const layers = getCachedMapLayers()
  await Promise.all(layers.map((layer) => deleteMapLayer(layer.id)))
  clearCachedMapLayers()
}

export type { MapLayerMeta, MapLayerStorageMode }
