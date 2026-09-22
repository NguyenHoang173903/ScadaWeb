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

/** Offline fallback khi chưa load được BE. Ẩn khi đã có BE khớp code/tên. */
export const PUMP_STATIONS: PumpStation[] = [
  {
    id: 'ap-bac',
    name: 'Trạm Bơm Ấp Bắc',
    code: 'TBAB',
    address: 'Thôn Võng La, xã Võng La, thành phố Hà Nội',
    status: 'Đang hoạt động',
    pumps: 10,
    capacity: '1.200 m³/h',
    lat: 21.10288377154832,
    lng: 105.7775102682173,
  },
]

const DYNAMIC_STORAGE_KEY = 'scadaweb.dynamic-pump-stations'

/** Mã cùng một trạm trên FE mock / Excel / DB. */
const STATION_CODE_ALIASES: Record<string, string> = {
  TBAB: 'TBAB',
  'TB-AB': 'TBAB',
  TB01: 'TBAB',
}

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

export function normalizeStationCode(code: string | undefined | null): string {
  const raw = (code ?? '').trim().toUpperCase()
  if (!raw) return ''
  return STATION_CODE_ALIASES[raw] ?? raw
}

export function normalizeNameKey(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^tb\s+/, '')
    .replace(/^tram\s+(bom\s+)?/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Khớp tên lỏng: "ap bac" ↔ "da chien ap bac" / "tram bom ap bac". */
export function stationNamesMatch(a: string, b: string): boolean {
  const left = normalizeNameKey(a)
  const right = normalizeNameKey(b)
  if (!left || !right) return false
  if (left === right) return true

  const [shorter, longer] = left.length <= right.length ? [left, right] : [right, left]
  const shortTokens = shorter.split(/\s+/).filter(Boolean)
  if (shortTokens.length >= 2 && shortTokens.every((token) => longer.includes(token))) {
    return true
  }
  return shorter.length >= 8 && longer.includes(shorter)
}

function hasCoords(station: PumpStation) {
  return Number.isFinite(station.lat) && Number.isFinite(station.lng) && (station.lat !== 0 || station.lng !== 0)
}

export function getPumpStationById(id: string) {
  if (!id) return undefined
  return readDynamicStations()[id] ?? PUMP_STATIONS.find((station) => station.id === id)
}

/**
 * Catalog hiển thị: khi đã có trạm BE (id số) → chỉ hiện các trạm đó.
 * Mock PUMP_STATIONS chỉ dùng offline khi chưa load được BE; tọa độ mock
 * bổ sung khi BE chưa có lat/lng.
 */
export function getAllPumpStations(): PumpStation[] {
  const dynamic = Object.values(readDynamicStations())
  const byId = new Map<string, PumpStation>()
  const beStations: PumpStation[] = []

  for (const station of dynamic) {
    if (/^\d+$/.test(station.id)) {
      byId.set(station.id, station)
      beStations.push(station)
    }
  }

  const findBeMatch = (station: PumpStation) => {
    const codeKey = normalizeStationCode(station.code)
    const byCode = codeKey
      ? beStations.find((s) => normalizeStationCode(s.code) === codeKey)
      : undefined
    if (byCode) return byCode
    return beStations.find((s) => stationNamesMatch(s.name, station.name))
  }

  // Đã có BE → chỉ catalog BE (đã enrich tọa độ mock nếu cần).
  if (beStations.length > 0) {
    for (const station of PUMP_STATIONS) {
      const be = findBeMatch(station)
      if (!be) continue
      if (!hasCoords(be) && hasCoords(station)) {
        const enriched = { ...be, lat: station.lat, lng: station.lng }
        byId.set(be.id, enriched)
      }
    }
    return [...byId.values()]
  }

  // Offline fallback: mock + dynamic slug (chưa có BE).
  for (const station of dynamic) {
    byId.set(station.id, station)
  }
  for (const station of PUMP_STATIONS) {
    if (!byId.has(station.id)) byId.set(station.id, station)
  }

  return [...byId.values()]
}

/**
 * Resolve map/list station → BE `scada.station.id` (chuỗi số).
 * Ưu tiên khớp theo tên BE, rồi code (có alias).
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

  if (station.name?.trim()) {
    const byName = all.find((s) => stationNamesMatch(s.name, station.name!))
    if (byName) return byName.id
  }

  const codeKey = normalizeStationCode(station.code)
  if (codeKey) {
    const byCode = all.find((s) => normalizeStationCode(s.code) === codeKey)
    if (byCode) return byCode.id
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
