import type { DataTableColumn } from '@/components/common/DataTable'
import type { ReportFilterValues } from '@/components/common/ReportFilterBar'

export type ReportRow = {
  id: string
  [key: string]: string
}

export const REPORT_DEVICE_OPTIONS = [
  { value: 'water-level', label: 'Mức nước' },
  ...Array.from({ length: 10 }, (_, index) => {
    const id = index + 1
    return { value: `pump-temp-${id}`, label: `Nhiệt độ bơm ${id}` }
  }),
  { value: 'input-meter', label: 'Đồng hồ điện đầu vào' },
]

export const DEFAULT_REPORT_FILTER: ReportFilterValues = {
  reportDate: '2026-01-06',
  startTime: '00:00:00',
  endTime: '23:59:59',
  deviceId: 'water-level',
}

export const REPORT_PAGE_SIZE = 8

const WATER_LEVEL_COLUMNS: DataTableColumn<ReportRow>[] = [
  { key: 'time', header: 'Thời gian', width: 120, render: (row) => row.time ?? '' },
  {
    key: 'riverLevel',
    header: 'Mức nước sông',
    width: 160,
    align: 'center',
    render: (row) => row.riverLevel ?? '',
  },
  {
    key: 'dischargeTankLevel',
    header: 'Mức bể xả',
    width: 140,
    align: 'center',
    render: (row) => row.dischargeTankLevel ?? '',
  },
]

const PUMP_TEMP_COLUMNS: DataTableColumn<ReportRow>[] = [
  { key: 'time', header: 'Thời gian', width: 140, render: (row) => row.time ?? '' },
  { key: 'pump', header: 'Bơm', width: 100, align: 'center', render: (row) => row.pump ?? '' },
  {
    key: 'tempA',
    header: 'Nhiệt độ A',
    width: 120,
    align: 'center',
    render: (row) => row.tempA ?? '',
  },
  {
    key: 'tempB',
    header: 'Nhiệt độ B',
    width: 120,
    align: 'center',
    render: (row) => row.tempB ?? '',
  },
  {
    key: 'tempC',
    header: 'Nhiệt độ C',
    width: 120,
    align: 'center',
    render: (row) => row.tempC ?? '',
  },
  {
    key: 'bearingBottom',
    header: 'Nhiệt độ bi dưới',
    width: 150,
    align: 'center',
    render: (row) => row.bearingBottom ?? '',
  },
  {
    key: 'bearingTop',
    header: 'Nhiệt độ bi trên',
    width: 150,
    align: 'center',
    render: (row) => row.bearingTop ?? '',
  },
]

const INPUT_METER_COLUMNS: DataTableColumn<ReportRow>[] = [
  { key: 'time', header: 'Thời gian', width: 130, render: (row) => row.time ?? '' },
  {
    key: 'meter',
    header: 'Đồng hồ',
    width: 110,
    align: 'center',
    render: (row) => row.meter ?? '',
  },
  {
    key: 'voltageRS',
    header: 'Điện áp RS',
    width: 110,
    align: 'center',
    render: (row) => row.voltageRS ?? '',
  },
  {
    key: 'voltageST',
    header: 'Điện áp ST',
    width: 110,
    align: 'center',
    render: (row) => row.voltageST ?? '',
  },
  {
    key: 'voltageRT',
    header: 'Điện áp RT',
    width: 110,
    align: 'center',
    render: (row) => row.voltageRT ?? '',
  },
  {
    key: 'currentR',
    header: 'Dòng R',
    width: 100,
    align: 'center',
    render: (row) => row.currentR ?? '',
  },
  {
    key: 'currentS',
    header: 'Dòng S',
    width: 100,
    align: 'center',
    render: (row) => row.currentS ?? '',
  },
  {
    key: 'currentT',
    header: 'Dòng T',
    width: 100,
    align: 'center',
    render: (row) => row.currentT ?? '',
  },
  {
    key: 'currentAvg',
    header: 'Dòng trung bình',
    width: 140,
    align: 'center',
    render: (row) => row.currentAvg ?? '',
  },
  {
    key: 'power',
    header: 'Công suất',
    width: 110,
    align: 'center',
    render: (row) => row.power ?? '',
  },
  {
    key: 'pf',
    header: 'PF',
    width: 80,
    align: 'center',
    render: (row) => row.pf ?? '',
  },
]

export function getReportColumns(deviceId: string): DataTableColumn<ReportRow>[] {
  if (deviceId === 'input-meter') return INPUT_METER_COLUMNS
  if (deviceId.startsWith('pump-temp-')) return PUMP_TEMP_COLUMNS
  return WATER_LEVEL_COLUMNS
}

export function getReportMinTableWidth(deviceId: string): number {
  if (deviceId === 'input-meter') return 1280
  if (deviceId.startsWith('pump-temp-')) return 980
  return 520
}

/** Mock theo thiết bị — hiện trống, tổng/trang tính từ length thực tế */
const REPORT_ROWS_BY_DEVICE: Record<string, ReportRow[]> = {
  'water-level': [],
  'input-meter': [],
  ...Object.fromEntries(
    Array.from({ length: 10 }, (_, index) => [`pump-temp-${index + 1}`, [] as ReportRow[]]),
  ),
}

export function getReportRows(deviceId: string): ReportRow[] {
  return REPORT_ROWS_BY_DEVICE[deviceId] ?? []
}
