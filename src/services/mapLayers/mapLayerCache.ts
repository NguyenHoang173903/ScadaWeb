import type { MapOverlayLayer } from '@/components/map/layerTypes'
import { disposeLayerMedia } from '@/components/map/parseLayerFile'
import type { MapLayerMeta } from './types'

/**
 * In-memory cache of the parsed active layer.
 * Login ↔ Dashboard remounts must not re-unzip/re-parse the KMZ.
 */
let cachedOverlay: MapOverlayLayer | null = null
let cachedMeta: MapLayerMeta | null = null
/** Bumps when file content changes (upload/delete), not on style-only edits. */
let contentRevision = 0

export function getCachedActiveMapLayer(): MapOverlayLayer | null {
  return cachedOverlay
}

export function getCachedActiveMapLayerMeta(): MapLayerMeta | null {
  return cachedMeta
}

export function getMapLayerContentRevision(): number {
  return contentRevision
}

export function setCachedActiveMapLayer(
  overlay: MapOverlayLayer,
  meta: MapLayerMeta,
  options?: { replaceFile?: boolean },
): void {
  if (options?.replaceFile !== false && cachedOverlay && cachedOverlay !== overlay) {
    disposeLayerMedia(cachedOverlay)
  }
  cachedOverlay = overlay
  cachedMeta = meta
  if (options?.replaceFile !== false) {
    contentRevision += 1
  }
}

export function patchCachedActiveMapLayerMeta(patch: Partial<MapLayerMeta>): void {
  if (!cachedOverlay || !cachedMeta) return
  cachedMeta = { ...cachedMeta, ...patch }
  cachedOverlay = {
    ...cachedOverlay,
    name: cachedMeta.name,
    opacity: cachedMeta.opacity,
    weight: cachedMeta.weight,
    visible: cachedMeta.visible,
    color: cachedMeta.color,
  }
}

export function clearCachedActiveMapLayer(): void {
  if (cachedOverlay) {
    disposeLayerMedia(cachedOverlay)
  }
  cachedOverlay = null
  cachedMeta = null
  contentRevision += 1
}

/** Snapshot for React state (keeps shared mediaUrls / objectUrls / geojson). */
export function snapshotCachedOverlay(): MapOverlayLayer | null {
  if (!cachedOverlay) return null
  return { ...cachedOverlay }
}
