import type { MapOverlayLayer } from '@/components/map/layerTypes'
import { disposeLayerMedia } from '@/components/map/parseLayerFile'
import type { MapLayerMeta } from './types'

type CachedEntry = {
  overlay: MapOverlayLayer
  meta: MapLayerMeta
}

/**
 * In-memory cache of parsed map layers.
 * Login ↔ Dashboard remounts must not re-unzip/re-parse KMZ files.
 */
const cache = new Map<string, CachedEntry>()
/** True after the first IndexedDB/API hydrate (even if zero layers). */
let cacheHydrated = false
/** Bumps when file content changes (upload/delete), not on style-only edits. */
let contentRevision = 0

export function getMapLayerContentRevision(): number {
  return contentRevision
}

export function isMapLayerCacheHydrated(): boolean {
  return cacheHydrated
}

export function markMapLayerCacheHydrated(): void {
  cacheHydrated = true
}

export function getCachedMapLayers(): MapOverlayLayer[] {
  return Array.from(cache.values()).map((entry) => ({ ...entry.overlay }))
}

export function hasCachedMapLayers(): boolean {
  return cache.size > 0
}

export function setCachedMapLayer(
  overlay: MapOverlayLayer,
  meta: MapLayerMeta,
  options?: { replaceFile?: boolean },
): void {
  const existing = cache.get(overlay.id)
  if (options?.replaceFile !== false && existing && existing.overlay !== overlay) {
    disposeLayerMedia(existing.overlay)
  }
  cache.set(overlay.id, { overlay, meta })
  cacheHydrated = true
  if (options?.replaceFile !== false) {
    contentRevision += 1
  }
}

export function setCachedMapLayers(
  entries: Array<{ overlay: MapOverlayLayer; meta: MapLayerMeta }>,
  options?: { replaceAll?: boolean },
): void {
  if (options?.replaceAll) {
    for (const entry of cache.values()) {
      disposeLayerMedia(entry.overlay)
    }
    cache.clear()
  }
  for (const { overlay, meta } of entries) {
    cache.set(overlay.id, { overlay, meta })
  }
  cacheHydrated = true
  contentRevision += 1
}

export function patchCachedMapLayerMeta(id: string, patch: Partial<MapLayerMeta>): void {
  const entry = cache.get(id)
  if (!entry) return
  const meta = { ...entry.meta, ...patch, id }
  cache.set(id, {
    meta,
    overlay: {
      ...entry.overlay,
      name: meta.name,
      opacity: meta.opacity,
      weight: meta.weight,
      visible: meta.visible,
      color: meta.color,
    },
  })
}

export function patchCachedMapLayerOverlay(
  id: string,
  patch: Partial<Pick<MapOverlayLayer, 'mediaUrls' | 'objectUrls' | 'geojson'>>,
): void {
  const entry = cache.get(id)
  if (!entry) return
  if (patch.objectUrls && entry.overlay.objectUrls && patch.objectUrls !== entry.overlay.objectUrls) {
    // Keep previous blobs until replaced — dispose old only when new media arrives.
    const prev = entry.overlay.objectUrls
    disposeLayerMedia({ objectUrls: prev })
  }
  cache.set(id, {
    ...entry,
    overlay: {
      ...entry.overlay,
      ...patch,
    },
  })
}

export function removeCachedMapLayer(id: string): void {
  const entry = cache.get(id)
  if (!entry) return
  disposeLayerMedia(entry.overlay)
  cache.delete(id)
  contentRevision += 1
}

export function clearCachedMapLayers(): void {
  for (const entry of cache.values()) {
    disposeLayerMedia(entry.overlay)
  }
  cache.clear()
  cacheHydrated = true
  contentRevision += 1
}
