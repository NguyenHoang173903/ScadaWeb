import type { EventFilterValues } from '@/components/common/EventFilterBar'
import type { DataTableColumn } from '@/components/common/DataTable'

export type ExistingErrorRow = {
  id: string
  stt: number
  device: string
  description: string
  type: string
  startedAt: string
  /** Alarm đang mở → luôn "Đang mở"; không dùng EndTime. */
  status: string
  acknowledged: string
}

export const EVENT_DEVICE_OPTIONS = [
  { value: 'all', label: 'Thiết bị' },
  ...Array.from({ length: 10 }, (_, index) => {
    const id = index + 1
    return { value: `pump-${id}`, label: `Bơm ${id}` }
  }),
]

function isoDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function defaultTodayRange() {
  const today = isoDate(new Date())
  return { fromDate: today, toDate: today }
}

export const DEFAULT_EVENT_FILTER: EventFilterValues = {
  deviceId: 'all',
  ...defaultTodayRange(),
  keyword: '',
}

export const EVENT_PAGE_SIZE = 8

/** Mock trống — tổng/trang tính từ length thực tế */
export const EXISTING_ERROR_ROWS: ExistingErrorRow[] = []

export const EXISTING_ERROR_COLUMNS: DataTableColumn<ExistingErrorRow>[] = [
  {
    key: 'stt',
    header: 'STT',
    width: 80,
    align: 'center',
    render: (row) => row.stt,
  },
  {
    key: 'device',
    header: 'Thiết bị',
    width: 140,
    render: (row) => row.device,
  },
  {
    key: 'description',
    header: 'Mô tả',
    render: (row) => row.description,
  },
  {
    key: 'type',
    header: 'Loại',
    width: 140,
    align: 'center',
    render: (row) => row.type,
  },
  {
    key: 'startedAt',
    header: 'Bắt đầu',
    width: 180,
    align: 'center',
    render: (row) => row.startedAt,
  },
  {
    key: 'status',
    header: 'Trạng thái',
    width: 120,
    align: 'center',
    render: (row) => row.status,
  },
  {
    key: 'acknowledged',
    header: 'Xác nhận',
    width: 110,
    align: 'center',
    render: (row) => row.acknowledged,
  },
]

export type HistoryTabId = 'status' | 'value-change' | 'system' | 'login'

export const HISTORY_TABS = [
  { id: 'status', label: 'Lỗi/Trạng thái' },
  { id: 'value-change', label: 'Giá trị thay đổi' },
  { id: 'system', label: 'Hệ thống' },
  { id: 'login', label: 'Đăng nhập' },
] as const

export type HistoryEventRow = {
  id: string
  stt: number
  time: string
  type: 'ERROR' | 'INFO' | 'WARNING' | 'PUMP' | 'Communication' | 'Security'
  title: string
  detail: string
  deviceId: string
  device: string
  tag: string
  user: string
  endedAt: string
  occurredAt?: string
}

const HISTORY_SEED: Omit<HistoryEventRow, 'id' | 'stt'>[] = [
  {
    time: '09:30:01 19/05/2026',
    type: 'ERROR',
    title: 'Lỗi bơm',
    detail: '',
    deviceId: 'pump-10',
    device: 'Bơm 10',
    tag: 'Pump_10_FB_Fault',
    user: '',
    endedAt: '17:31:01 19/05/2026',
  },
  {
    time: '09:30:01 19/05/2026',
    type: 'ERROR',
    title: 'Lỗi nhiệt độ',
    detail: '',
    deviceId: 'pump-10',
    device: 'Bơm 10',
    tag: 'Pump_10_FB_Fault_Temp',
    user: '',
    endedAt: '17:31:01 19/05/2026',
  },
]

const VALUE_CHANGE_SEED: Omit<HistoryEventRow, 'id' | 'stt'>[] = [
  {
    time: '09:30:01 19/05/2026',
    type: 'PUMP',
    title: 'Manual Start',
    detail: 'User OP manually started Pump 10',
    deviceId: 'pump-10',
    device: 'Bơm 10',
    tag: '',
    user: 'OP',
    endedAt: '',
  },
  {
    time: '09:30:01 19/05/2026',
    type: 'PUMP',
    title: 'Manual Start',
    detail: 'User OP manually started Pump 7',
    deviceId: 'pump-7',
    device: 'Bơm 7',
    tag: '',
    user: 'OP',
    endedAt: '',
  },
]

function buildHistoryRows(count: number): HistoryEventRow[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = HISTORY_SEED[index % HISTORY_SEED.length]
    const pumpNo = (index % 10) + 1
    return {
      ...seed,
      id: `history-status-${index + 1}`,
      stt: index + 1,
      title: index % 2 === 0 ? `Lỗi bơm ${pumpNo}` : `Lỗi nhiệt độ ${pumpNo}`,
      deviceId: `pump-${pumpNo}`,
      device: `Bơm ${pumpNo}`,
      tag:
        index % 2 === 0
          ? `Pump_${pumpNo}_FB_Fault`
          : `Pump_${pumpNo}_FB_Fault_Temp`,
    }
  })
}

function buildValueChangeRows(count: number): HistoryEventRow[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = VALUE_CHANGE_SEED[index % VALUE_CHANGE_SEED.length]
    const pumpNo = index % 2 === 0 ? 10 : 7
    const alternatePump = (index % 10) + 1
    const pump = index < 2 ? pumpNo : alternatePump
    return {
      ...seed,
      id: `history-value-${index + 1}`,
      stt: index + 1,
      detail: `User OP manually started Pump ${pump}`,
      deviceId: `pump-${pump}`,
      device: `Bơm ${pump}`,
      user: 'OP',
      tag: '',
      endedAt: '',
    }
  })
}

const SYSTEM_SEED: Omit<HistoryEventRow, 'id' | 'stt'>[] = [
  {
    time: '09:30:01 19/05/2026',
    type: 'Communication',
    title: 'MQTT Published failed',
    detail: 'MQTT published failed on TBAB/Operation Staff',
    deviceId: 'all',
    device: '',
    tag: '',
    user: 'OP',
    endedAt: '',
  },
  {
    time: '09:30:01 19/05/2026',
    type: 'Communication',
    title: 'MQTT Disconnected',
    detail: 'MQTT disconnection from 192.168.1.2',
    deviceId: 'all',
    device: '',
    tag: '',
    user: 'OP',
    endedAt: '',
  },
]

function buildSystemRows(count: number): HistoryEventRow[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = SYSTEM_SEED[index % SYSTEM_SEED.length]
    return {
      ...seed,
      id: `history-system-${index + 1}`,
      stt: index + 1,
      title: index % 2 === 0 ? 'MQTT Published failed' : 'MQTT Disconnected',
      detail:
        index % 2 === 0
          ? 'MQTT published failed on TBAB/Operation Staff'
          : `MQTT disconnection from 192.168.1.${(index % 250) + 1}`,
    }
  })
}

export const HISTORY_ROWS_BY_TAB: Record<HistoryTabId, HistoryEventRow[]> = {
  status: buildHistoryRows(90),
  'value-change': buildValueChangeRows(90),
  system: buildSystemRows(90),
  login: [],
}

export function getHistoryBadgeTone(
  type: HistoryEventRow['type'],
): 'red' | 'yellow' | 'blue' | 'teal' {
  if (type === 'ERROR') return 'red'
  if (type === 'WARNING') return 'yellow'
  if (type === 'PUMP' || type === 'Communication') return 'teal'
  if (type === 'Security') return 'blue'
  return 'blue'
}

function formatHistoryTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

export function auditLogToHistoryRow(
  log: {
    id: string
    title: string
    detail: string
    username: string
    occurredAt: string
    endedAt?: string | null
  },
  index: number,
): HistoryEventRow {
  return {
    id: log.id,
    stt: index + 1,
    time: formatHistoryTime(log.occurredAt),
    type: 'Security',
    title: log.title,
    detail: log.detail,
    deviceId: 'all',
    device: '',
    tag: '',
    user: log.username,
    endedAt: log.endedAt ? formatHistoryTime(log.endedAt) : '',
    occurredAt: log.occurredAt,
  }
}
