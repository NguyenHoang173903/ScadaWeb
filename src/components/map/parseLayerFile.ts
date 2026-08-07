import JSZip from 'jszip'
import { kml as kmlToGeoJson } from '@tmcw/togeojson'
import type { FeatureCollection } from 'geojson'
import type { MapOverlayLayer } from './layerTypes'

export type ImportedLayerPackage = {
  geojson: FeatureCollection
  /** Relative path (e.g. files/a.jpg) → blob:/object URL */
  mediaUrls: Record<string, string>
  /** All created object URLs — revoke when replacing/removing the layer */
  objectUrls: string[]
}

export function parseKmlString(kmlString: string): FeatureCollection {
  const dom = new DOMParser().parseFromString(kmlString, 'text/xml')
  return kmlToGeoJson(dom) as FeatureCollection
}

function normalizeMediaKey(path: string) {
  return path
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/^\//, '')
    .trim()
}

function mimeFromName(name: string) {
  const ext = name.toLowerCase().split('.').pop()
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    case 'svg':
      return 'image/svg+xml'
    default:
      return 'application/octet-stream'
  }
}

async function extractKmzPackage(file: File): Promise<ImportedLayerPackage> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const entries = Object.values(zip.files).filter((entry) => !entry.dir)

  const kmlEntry = entries.find((entry) => entry.name.toLowerCase().endsWith('.kml'))
  if (!kmlEntry) {
    throw new Error('Không tìm thấy file KML trong KMZ')
  }

  const geojson = parseKmlString(await kmlEntry.async('string'))
  const mediaUrls: Record<string, string> = {}
  const objectUrls: string[] = []

  const kmlDir = kmlEntry.name.includes('/')
    ? kmlEntry.name.slice(0, kmlEntry.name.lastIndexOf('/') + 1)
    : ''

  for (const entry of entries) {
    if (entry.name.toLowerCase().endsWith('.kml')) continue

    const blob = await entry.async('blob')
    const typed = blob.type
      ? blob
      : new Blob([blob], { type: mimeFromName(entry.name) })
    const objectUrl = URL.createObjectURL(typed)
    objectUrls.push(objectUrl)

    const fullKey = normalizeMediaKey(entry.name)
    mediaUrls[fullKey] = objectUrl
    mediaUrls[fullKey.toLowerCase()] = objectUrl

    // Paths relative to the KML file location (common in Google Earth KMZ).
    if (kmlDir && fullKey.startsWith(normalizeMediaKey(kmlDir))) {
      const relativeToKml = normalizeMediaKey(fullKey.slice(normalizeMediaKey(kmlDir).length))
      if (relativeToKml) {
        mediaUrls[relativeToKml] = objectUrl
        mediaUrls[relativeToKml.toLowerCase()] = objectUrl
      }
    }

    // Basename fallback
    const baseName = fullKey.split('/').pop()
    if (baseName) {
      mediaUrls[baseName] = objectUrl
      mediaUrls[`files/${baseName}`] = objectUrl
      mediaUrls[baseName.toLowerCase()] = objectUrl
      mediaUrls[`files/${baseName}`.toLowerCase()] = objectUrl
    }
  }

  return { geojson, mediaUrls, objectUrls }
}

export async function importLayerPackage(file: File): Promise<ImportedLayerPackage> {
  const ext = file.name.toLowerCase().split('.').pop()
  if (ext === 'kmz') return extractKmzPackage(file)

  if (ext === 'kml') {
    return {
      geojson: parseKmlString(await file.text()),
      mediaUrls: {},
      objectUrls: [],
    }
  }

  throw new Error(`Định dạng không hỗ trợ: .${ext}. Chỉ chấp nhận .kml và .kmz`)
}

/** @deprecated Prefer importLayerPackage for uploads that include media. */
export async function parseLayerFile(file: File): Promise<FeatureCollection> {
  const imported = await importLayerPackage(file)
  imported.objectUrls.forEach((url) => URL.revokeObjectURL(url))
  return imported.geojson
}

export async function parseLayerUrl(url: string): Promise<FeatureCollection> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Không tải được lớp bản đồ: ${url}`)
  }

  const path = url.split('?')[0].toLowerCase()
  if (path.endsWith('.kmz')) {
    const blob = await res.blob()
    const imported = await extractKmzPackage(new File([blob], 'layer.kmz'))
    imported.objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl))
    return imported.geojson
  }

  return parseKmlString(await res.text())
}

export function disposeLayerMedia(layer: Pick<MapOverlayLayer, 'objectUrls'>) {
  layer.objectUrls?.forEach((url) => {
    try {
      URL.revokeObjectURL(url)
    } catch {
      // ignore invalid/already-revoked URLs
    }
  })
}

export function disposeLayersMedia(layers: Array<Pick<MapOverlayLayer, 'objectUrls'>>) {
  layers.forEach(disposeLayerMedia)
}
