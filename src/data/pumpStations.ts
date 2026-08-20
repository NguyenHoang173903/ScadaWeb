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

export function getPumpStationById(id: string) {
  if (!id) return undefined
  return (
    PUMP_STATIONS.find((station) => station.id === id) ??
    readDynamicStations()[id]
  )
}

const DYNAMIC_STORAGE_KEY = 'scadaweb.dynamic-pump-stations'

type MapStationLike = {
  id: string
  name: string
  lat: number
  lng: number
  routeId?: string
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

/** Register a KML/KMZ map point so detail routes work even without mock catalog match. */
export function ensureMapPumpStation(station: MapStationLike): string {
  const routeId = station.routeId || station.id
  if (PUMP_STATIONS.some((item) => item.id === routeId)) return routeId

  const next: PumpStation = {
    id: routeId,
    name: station.name.startsWith('Trạm') ? station.name : `Trạm ${station.name}`,
    code: routeId.slice(0, 12).toUpperCase(),
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
