import type { LineChartPoint, LineChartSeries } from '@/components/common/LineChartCard'
import type { ChartFilterValues } from '@/components/common/ChartFilterBar'

export const CHART_DEVICE_OPTIONS = Array.from({ length: 10 }, (_, index) => {
  const id = index + 1
  return { value: String(id), label: `Bơm ${id}` }
})

export const DEFAULT_CHART_FILTER: ChartFilterValues = {
  deviceId: '1',
  fromDate: '2026-01-06',
  fromTime: '23:12:00',
  toDate: '2026-01-06',
  toTime: '23:12:00',
}

export const TEMPERATURE_SERIES: LineChartSeries[] = [
  { key: 'actual', label: 'Nhiệt độ thực tế', color: '#86efac' },
  { key: 'allowed', label: 'Nhiệt độ cho phép', color: '#ef4444' },
  { key: 'bearingTop', label: 'Nhiệt độ bi trên', color: '#eab308' },
  { key: 'bearingBottom', label: 'Nhiệt độ bi dưới', color: '#14b8a6' },
]

/** Mock data gần với ảnh mẫu (interval 30s) */
export const TEMPERATURE_CHART_DATA: LineChartPoint[] = [
  { time: '23:22:00', actual: 8, allowed: 26, bearingTop: 29, bearingBottom: 22 },
  { time: '23:22:30', actual: 6, allowed: 26, bearingTop: 27, bearingBottom: 20 },
  { time: '23:23:00', actual: 9, allowed: 26, bearingTop: 24, bearingBottom: 18 },
  { time: '23:23:30', actual: 7, allowed: 26, bearingTop: 28, bearingBottom: 24 },
  { time: '23:24:00', actual: 10, allowed: 26, bearingTop: 31, bearingBottom: 21 },
  { time: '23:24:30', actual: 5, allowed: 26, bearingTop: 34, bearingBottom: 27 },
]

export const CURRENT_SERIES: LineChartSeries[] = [
  { key: 'phaseT', label: 'Dòng điện T', color: '#22c55e' },
  { key: 'phaseS', label: 'Dòng điện S', color: '#e879f9' },
  { key: 'phaseR', label: 'Dòng điện R', color: '#0d9488' },
]

/** Mock data đồ thị dòng điện (interval 30s) */
export const CURRENT_CHART_DATA: LineChartPoint[] = [
  { time: '23:22:00', phaseT: 22, phaseS: 28, phaseR: 18 },
  { time: '23:22:30', phaseT: 18, phaseS: 24, phaseR: 15 },
  { time: '23:23:00', phaseT: 26, phaseS: 20, phaseR: 22 },
  { time: '23:23:30', phaseT: 20, phaseS: 30, phaseR: 16 },
  { time: '23:24:00', phaseT: 29, phaseS: 23, phaseR: 25 },
  { time: '23:24:30', phaseT: 17, phaseS: 32, phaseR: 19 },
]

export type ChartTabId = 'temperature' | 'current'
