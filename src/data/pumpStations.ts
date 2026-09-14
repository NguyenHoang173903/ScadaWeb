export type PumpStation = {
  id: string
  name: string
  code: string
  address: string
  status: 'Đang hoạt động' | 'Ngưng hoạt động'
  pumps: number
  capacity: string
  lat: number
  lng: number
}

/** Offline fallback khi chưa load được BE. Khi có station BE cùng code → bị ẩn. */
export const PUMP_STATIONS: PumpStation[] = [
  {
    id: 'ap-bac',
    name: 'Trạm Bơm Dã Chiến Ấp Bắc',
    code: 'TB-AB',
    address: 'Thôn Võng La, xã Võng La, thành phố Hà Nội',
    status: 'Đang hoạt động',
    pumps: 10,
    capacity: '1.200 m³/h',
    lat: 21.10288377154832,
    lng: 105.7775102682173,
  },
]

const DYNAMIC_STORAGE_KEY = 'scadaweb.dynamic-pump-stations'

type MapStationLike = {
  id: string
  name: string
  lat: number
  lng: number
  routeId?: string
  code?: string
}

function readDynamicStations(): Record<string, PumpStation> {
  try {
    const raw = sessionStorage.getItem(DYNAMIC_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, PumpStation>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeDynamicStations(stations: Record<string, PumpStation>) {
  try {
    sessionStorage.setItem(DYNAMIC_STORAGE_KEY, JSON.stringify(stations))
  } catch {
    // Ignore quota / private mode errors.
  }
}

export function getPumpStationById(id: string) {
  if (!id) return undefined
  return readDynamicStations()[id] ?? PUMP_STATIONS.find((station) => station.id === id)
}

/** Static mock + stations from API. BE numeric id wins over slug mock (same code). */
export function getAllPumpStations(): PumpStation[] {
  const dynamic = Object.values(readDynamicStations())
  const byId = new Map<string, PumpStation>()
  const numericByCode = new Map<string, string>()

  for (const station of dynamic) {
    byId.set(station.id, station)
    if (/^\d+$/.test(station.id) && station.code) {
      numericByCode.set(station.code.trim().toUpperCase(), station.id)
    }
  }

  for (const station of PUMP_STATIONS) {
    const beId = numericByCode.get(station.code.trim().toUpperCase())
    if (beId) continue
    if (!byId.has(station.id)) byId.set(station.id, station)
  }

  return [...byId.values()]
}

function normalizeNameKey(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^tb\s+/, '')
    .replace(/^tram\s+(bom\s+)?/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Resolve map/list station → BE `scada.station.id` (chuỗi số).
 * Null nếu chưa khớp backend — không tạo slug route giả.
 */
export function resolvePumpStationRouteId(station: {
  id?: string
  routeId?: string
  name?: string
  code?: string
}): string | null {
  const candidates = [station.routeId, station.id].filter(Boolean) as string[]
  for (const candidate of candidates) {
    if (/^\d+$/.test(candidate)) return candidate
    const found = getPumpStationById(candidate)
    if (found && /^\d+$/.test(found.id)) return found.id
  }

  const all = getAllPumpStations().filter((s) => /^\d+$/.test(s.id))
  const code = station.code?.trim().toUpperCase()
  if (code) {
    const byCode = all.find((s) => s.code.trim().toUpperCase() === code)
    if (byCode) return byCode.id
  }

  const nameKey = station.name ? normalizeNameKey(station.name) : ''
  if (nameKey) {
    const byName = all.find((s) => {
      const key = normalizeNameKey(s.name)
      return key === nameKey || key.includes(nameKey) || nameKey.includes(key)
    })
    if (byName) return byName.id
  }

  return null
}

/** Register / overwrite a station in the dynamic catalog (API). */
export function registerPumpStation(station: PumpStation) {
  const all = readDynamicStations()
  all[station.id] = { ...station }
  writeDynamicStations(all)
}

/**
 * Offline/legacy: đăng ký điểm map khi chưa có BE id.
 * Prefer {@link resolvePumpStationRouteId} trên Dashboard.
 */
export function ensureMapPumpStation(station: MapStationLike): string {
  const resolved = resolvePumpStationRouteId(station)
  if (resolved) return resolved

  const routeId = station.routeId || station.id
  if (PUMP_STATIONS.some((item) => item.id === routeId)) return routeId
  if (readDynamicStations()[routeId]) return routeId

  const next: PumpStation = {
    id: routeId,
    name: station.name.startsWith('Trạm') ? station.name : `Trạm ${station.name}`,
    code: station.code || routeId.slice(0, 12).toUpperCase(),
    address: `Tọa độ ${station.lat.toFixed(5)}, ${station.lng.toFixed(5)}`,
    status: 'Đang hoạt động',
    pumps: 0,
    capacity: '—',
    lat: station.lat,
    lng: station.lng,
  }

  const all = readDynamicStations()
  all[routeId] = next
  writeDynamicStations(all)
  return routeId
}
