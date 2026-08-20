/**
 * Filesystem-backed map layers via Vite plugin (`public/map-layers/`).
 * Upload writes KMZ + geometry.geojson to disk; reload reads static URLs.
 */
import type { FeatureCollection } from 'geojson'
import type { MapLayerMeta, MapLayerPackage } from './types'

type ManifestLayer = {
  id: string
  meta: MapLayerMeta
  fileName: string
  fileUrl: string
  geojsonUrl?: string
  mediaBaseUrl?: string
}

export async function fsDownloadLayerFile(fileUrl: string, fileName: string): Promise<File> {
  const response = await fetch(fileUrl)
  if (!response.ok) {
    throw new Error(`Không tải được file lớp bản đồ (${response.status})`)
  }
  const blob = await response.blob()
  return new File([blob], fileName || 'layer.kmz', {
    type: blob.type || 'application/octet-stream',
  })
}

async function downloadGeojson(url: string): Promise<FeatureCollection | undefined> {
  try {
    const response = await fetch(url)
    if (!response.ok) return undefined
    return (await response.json()) as FeatureCollection
  } catch {
    return undefined
  }
}

function stubFile(fileName: string): File {
  return new File([], fileName || 'layer.kmz', { type: 'application/octet-stream' })
}

/** Prefer Vite FS API; fall back to static manifest for production builds. */
export async function fsListMapLayers(): Promise<MapLayerPackage[]> {
  let entries: ManifestLayer[] = []

  try {
    const live = await fetch('/__map-layers')
    if (live.ok) {
      const parsed = (await live.json()) as ManifestLayer[]
      if (Array.isArray(parsed)) entries = parsed
    }
  } catch {
    // Fall through to static manifest.
  }

  if (entries.length === 0) {
    try {
      const manifestRes = await fetch('/map-layers/manifest.json', { cache: 'no-store' })
      if (manifestRes.ok) {
        const manifest = (await manifestRes.json()) as { layers?: ManifestLayer[] }
        entries = Array.isArray(manifest.layers) ? manifest.layers : []
      }
    } catch {
      return []
    }
  }

  // Paint from geometry.geojson in parallel — do NOT download KMZ first
  // (hethongkenh.kmz can be hundreds of MB).
  return Promise.all(
    entries.map(async (entry) => {
      const fileName = entry.meta.fileName || entry.fileName || 'layer.kmz'
      const geojson = entry.geojsonUrl ? await downloadGeojson(entry.geojsonUrl) : undefined

      if (geojson) {
        return {
          meta: { ...entry.meta, id: entry.id || entry.meta.id, fileName },
          file: stubFile(fileName),
          fileUrl: entry.fileUrl,
          geojson,
          mediaBaseUrl: entry.mediaBaseUrl || `/map-layers/${entry.id || entry.meta.id}/`,
        }
      }

      // No cached geometry — must download source file to parse.
      const file = await fsDownloadLayerFile(entry.fileUrl, fileName)
      return {
        meta: { ...entry.meta, id: entry.id || entry.meta.id, fileName },
        file,
        fileUrl: entry.fileUrl,
        mediaBaseUrl: entry.mediaBaseUrl || `/map-layers/${entry.id || entry.meta.id}/`,
      }
    }),
  )
}

export async function fsUploadMapLayer(
  file: File,
  meta: MapLayerMeta,
  geojson?: FeatureCollection,
): Promise<MapLayerPackage> {
  const form = new FormData()
  form.append('file', file, file.name)
  form.append('meta', JSON.stringify(meta))
  if (geojson) {
    form.append(
      'geojson',
      new Blob([JSON.stringify(geojson)], { type: 'application/json' }),
      'geometry.geojson',
    )
  }

  const response = await fetch('/__map-layers', {
    method: 'POST',
    body: form,
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Upload failed (${response.status})`)
  }

  const entry = (await response.json()) as ManifestLayer
  return {
    meta: { ...entry.meta, id: entry.id },
    file,
    fileUrl: entry.fileUrl,
    geojson,
    mediaBaseUrl: entry.mediaBaseUrl || `/map-layers/${entry.id}/`,
  }
}

export async function fsUpdateMapLayerMeta(
  id: string,
  patch: Partial<MapLayerMeta>,
): Promise<MapLayerMeta | null> {
  const response = await fetch(`/__map-layers/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`Update layer meta failed (${response.status})`)
  }
  return (await response.json()) as MapLayerMeta
}

export async function fsDeleteMapLayer(id: string): Promise<void> {
  const response = await fetch(`/__map-layers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  if (!response.ok && response.status !== 204) {
    throw new Error(`Delete layer failed (${response.status})`)
  }
}
