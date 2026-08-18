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
    name: 'Trạm Ấp Bắc',
    code: 'TB-AB',
    address: 'Thôn Võng La, xã Võng La, thành phố Hà Nội',
    status: 'Đang hoạt động',
    pumps: 10,
    capacity: '1.200 m³/h',
    lat: 21.15,
    lng: 105.6542,
  },
  {
    id: 'noi-bai',
    name: 'Trạm Nội Bài',
    code: 'TB-NB',
    address: 'Nội Bài, Hà Nội',
    status: 'Đang hoạt động',
    pumps: 3,
    capacity: '980 m³/h',
    lat: 21.2185,
    lng: 105.8042,
  },
  {
    id: 'thanh-diem',
    name: 'Trạm Thanh Điềm',
    code: 'TB-TD',
    address: 'Thanh Điềm, Hà Nội',
    status: 'Đang hoạt động',
    pumps: 2,
    capacity: '750 m³/h',
    lat: 21.12,
    lng: 105.72,
  },
  {
    id: 'thinh-lien',
    name: 'Trạm Thịnh Liên',
    code: 'TB-TL',
    address: 'Thịnh Liên, Hà Nội',
    status: 'Đang hoạt động',
    pumps: 3,
    capacity: '860 m³/h',
    lat: 21.08,
    lng: 105.69,
  },
  {
    id: 'phu-dong',
    name: 'Trạm Phù Đổng',
    code: 'TB-PD',
    address: 'Phù Đổng, Hà Nội',
    status: 'Đang hoạt động',
    pumps: 5,
    capacity: '1.450 m³/h',
    lat: 21.06,
    lng: 105.95,
  },
  {
    id: 'tam-bao',
    name: 'Trạm Tam Bảo',
    code: 'TB-TB',
    address: 'Tam Bảo, Hà Nội',
    status: 'Đang hoạt động',
    pumps: 2,
    capacity: '640 m³/h',
    lat: 21.03,
    lng: 105.81,
  },
  {
    id: 'thac-qua',
    name: 'Trạm Thạc Quả',
    code: 'TB-TQ',
    address: 'Thạc Quả, Hà Nội',
    status: 'Đang hoạt động',
    pumps: 3,
    capacity: '920 m³/h',
    lat: 21.01,
    lng: 105.78,
  },
  {
    id: 'dong-anh',
    name: 'Trạm Đông Anh',
    code: 'TB-DA',
    address: 'Đông Anh, Hà Nội',
    status: 'Đang hoạt động',
    pumps: 4,
    capacity: '1.100 m³/h',
    lat: 21.14,
    lng: 105.85,
  },
  {
    id: 'gia-lam',
    name: 'Trạm Gia Lâm',
    code: 'TB-GL',
    address: 'Gia Lâm, Hà Nội',
    status: 'Đang hoạt động',
    pumps: 3,
    capacity: '870 m³/h',
    lat: 21.05,
    lng: 105.9,
  },
  {
    id: 'soc-son',
    name: 'Trạm Sóc Sơn',
    code: 'TB-SS',
    address: 'Sóc Sơn, Hà Nội',
    status: 'Ngưng hoạt động',
    pumps: 2,
    capacity: '700 m³/h',
    lat: 21.26,
    lng: 105.85,
  },
  {
    id: 'me-linh',
    name: 'Trạm Mê Linh',
    code: 'TB-ML',
    address: 'Mê Linh, Hà Nội',
    status: 'Đang hoạt động',
    pumps: 3,
    capacity: '830 m³/h',
    lat: 21.18,
    lng: 105.72,
  },
  {
    id: 'hoai-duc',
    name: 'Trạm Hoài Đức',
    code: 'TB-HD',
    address: 'Hoài Đức, Hà Nội',
    status: 'Đang hoạt động',
    pumps: 2,
    capacity: '610 m³/h',
    lat: 21.02,
    lng: 105.7,
  },
  {
    id: 'thanh-tri',
    name: 'Trạm Thanh Trì',
    code: 'TB-TT',
    address: 'Thanh Trì, Hà Nội',
    status: 'Đang hoạt động',
    pumps: 4,
    capacity: '1.050 m³/h',
    lat: 20.97,
    lng: 105.86,
  },
  {
    id: 'thuong-tin',
    name: 'Trạm Thường Tín',
    code: 'TB-THT',
    address: 'Thường Tín, Hà Nội',
    status: 'Đang hoạt động',
    pumps: 3,
    capacity: '790 m³/h',
    lat: 20.87,
    lng: 105.86,
  },
  {
    id: 'tuyen-tieu-7-xa-nhanh-1',
    name: 'Tuyến tiêu 7 Xã Nhánh 1',
    code: 'TB-TT7N1',
    address: 'CN Xí nghiệp thủy lợi Gia Lâm – Cụm Phù Đổng, Hà Nội',
    status: 'Đang hoạt động',
    pumps: 2,
    capacity: '850 m³/h',
    lat: 21.07153406324338,
    lng: 105.9445170968886,
  },
  {
    id: 'tuyen-tieu-7-xa-nhanh-2',
    name: 'Tuyến tiêu 7 Xã nhánh 2',
    code: 'TB-TT7N2',
    address: 'CN Xí nghiệp thủy lợi Gia Lâm – Cụm Phù Đổng, Hà Nội',
    status: 'Ngưng hoạt động',
    pumps: 2,
    capacity: '720 m³/h',
    lat: 21.06345849989141,
    lng: 105.9434764881519,
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
