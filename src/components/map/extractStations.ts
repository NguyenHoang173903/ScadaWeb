import type { Feature, FeatureCollection, Geometry, Position } from 'geojson'
import { PUMP_STATIONS } from '@/data/pumpStations'

export type MapStationType = 'pump' | 'rain' | 'level'

export type MapStation = {
  id: string
  name: string
  lat: number
  lng: number
  type: MapStationType
  /** Color from KMZ/KML style when available */
  color?: string
  /** Raw KML/KMZ description HTML */
  description?: string
  /** Base URL for images referenced as files/... in description */
  mediaBaseUrl?: string
  /** Blob URLs extracted from an uploaded KMZ */
  mediaUrls?: Record<string, string>
  /** Matched app route id when available */
  routeId?: string
}

export const STATION_TYPE_COLOR: Record<MapStationType, string> = {
  pump: '#0CFF0C',
  rain: '#F4B400',
  level: '#2D7DD2',
}

function pointCoord(geometry: Geometry | null | undefined): Position | null {
  if (!geometry) return null
  if (geometry.type === 'Point') return geometry.coordinates
  if (geometry.type === 'GeometryCollection') {
    for (const child of geometry.geometries) {
      const coord = pointCoord(child)
      if (coord) return coord
    }
  }
  return null
}

function getFeatureName(feature: Feature): string {
  const name = (feature.properties as { name?: unknown } | null)?.name
  return typeof name === 'string' ? name.trim() : ''
}

function classifyStation(name: string): MapStationType {
  const lower = name.toLowerCase()
  if (/đo\s*mưa|diem do mua|điểm đo mưa/.test(lower)) return 'rain'
  if (/mực nước|muc nuoc|\bmn\b|đo\s*mn/.test(lower)) return 'level'
  return 'pump'
}

function normalizeStationKey(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^tb\s+/, '')
    .replace(/^tram\s+/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function matchRouteId(stationName: string): string | undefined {
  const key = normalizeStationKey(stationName)
  if (!key) return undefined

  const found = PUMP_STATIONS.find((station) => {
    const stationKey = normalizeStationKey(station.name)
    return stationKey === key || stationKey.includes(key) || key.includes(stationKey)
  })
  return found?.id
}

function slugId(name: string, lat: number, lng: number) {
  const base = normalizeStationKey(name).replace(/\s+/g, '-')
  return base || `point-${lat.toFixed(5)}-${lng.toFixed(5)}`
}

function typeFromFeature(name: string): MapStationType {
  return classifyStation(name)
}

function getFeatureDescription(feature: Feature): string {
  const description = (feature.properties as { description?: unknown } | null)?.description
  if (typeof description === 'string') return description
  if (description && typeof description === 'object' && 'value' in description) {
    const value = (description as { value?: unknown }).value
    if (typeof value === 'string') return value
  }
  const desc = (feature.properties as { desc?: unknown } | null)?.desc
  return typeof desc === 'string' ? desc : ''
}

/**
 * Only native Point placemarks from KMZ/KML — never invent stations from line names.
 */
export function extractStationsFromGeoJson(
  geojson: FeatureCollection,
  mediaBaseUrl?: string,
  mediaUrls?: Record<string, string>,
): MapStation[] {
  const stations: MapStation[] = []

  for (const feature of geojson.features) {
    if (feature.geometry?.type !== 'Point') continue

    const coord = pointCoord(feature.geometry)
    if (!coord) continue

    const [lng, lat] = coord
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

    const name = getFeatureName(feature) || `Điểm ${lat.toFixed(4)}, ${lng.toFixed(4)}`
    const type = typeFromFeature(name)
    const color = STATION_TYPE_COLOR[type]

    stations.push({
      id: slugId(name, lat, lng),
      name,
      lat,
      lng,
      type,
      color,
      description: getFeatureDescription(feature),
      mediaBaseUrl,
      mediaUrls,
      routeId: matchRouteId(name),
    })
  }

  return stations.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
}

export function extractStationsFromLayers(
  layers: Array<{
    geojson: FeatureCollection
    visible?: boolean
    mediaBaseUrl?: string
    mediaUrls?: Record<string, string>
  }>,
): MapStation[] {
  const byKey = new Map<string, MapStation>()

  for (const layer of layers) {
    if (layer.visible === false) continue
    for (const station of extractStationsFromGeoJson(
      layer.geojson,
      layer.mediaBaseUrl,
      layer.mediaUrls,
    )) {
      const key = `${station.lat.toFixed(6)},${station.lng.toFixed(6)}`
      if (!byKey.has(key)) byKey.set(key, station)
    }
  }

  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name, 'vi'))
}
