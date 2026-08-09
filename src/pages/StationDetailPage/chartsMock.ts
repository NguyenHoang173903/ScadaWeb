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
  { key: 'windingA', label: 'Nhiệt độ cuộn A', color: '#22c55e' },
  { key: 'windingB', label: 'Nhiệt độ cuộn B', color: '#c026d3' },
  { key: 'windingC', label: 'Nhiệt độ cuộn C', color: '#1d4ed8' },
  { key: 'bearingTop', label: 'Nhiệt độ bi trên', color: '#eab308' },
  { key: 'bearingBottom', label: 'Nhiệt độ bi dưới', color: '#14b8a6' },
  { key: 'windingAAllowed', label: 'Nhiệt độ cho phép cuộn A', color: '#ef4444', showDot: false },
  { key: 'windingBAllowed', label: 'Nhiệt độ cho phép cuộn B', color: '#86efac', showDot: false },
  { key: 'windingCAllowed', label: 'Nhiệt độ cho phép cuộn C', color: '#fdba74', showDot: false },
  { key: 'bearingTopAllowed', label: 'Nhiệt độ cho phép bi trên', color: '#93c5fd', showDot: false },
  { key: 'bearingBottomAllowed', label: 'Nhiệt độ cho phép bi dưới', color: '#c4b5fd', showDot: false },
]

/** Mock data gần với ảnh mẫu (interval 30s) */
export const TEMPERATURE_CHART_DATA: LineChartPoint[] = [
  {
    time: '23:22:00',
    windingA: 8,
    windingB: 10,
    windingC: 13,
    bearingTop: 29,
    bearingBottom: 22,
    windingAAllowed: 36,
    windingBAllowed: 36.5,
    windingCAllowed: 38.5,
    bearingTopAllowed: 37.5,
    bearingBottomAllowed: 38,
  },
  {
    time: '23:22:30',
    windingA: 5,
    windingB: 7,
    windingC: 12,
    bearingTop: 27,
    bearingBottom: 20,
    windingAAllowed: 36,
    windingBAllowed: 36.5,
    windingCAllowed: 38.5,
    bearingTopAllowed: 37.5,
    bearingBottomAllowed: 38,
  },
  {
    time: '23:23:00',
    windingA: 9,
    windingB: 11,
    windingC: 14,
    bearingTop: 24,
    bearingBottom: 18,
    windingAAllowed: 36,
    windingBAllowed: 36.5,
    windingCAllowed: 38.5,
    bearingTopAllowed: 37.5,
    bearingBottomAllowed: 38,
  },
  {
    time: '23:23:30',
    windingA: 6,
    windingB: 8,
    windingC: 12,
    bearingTop: 28,
    bearingBottom: 24,
    windingAAllowed: 36,
    windingBAllowed: 36.5,
    windingCAllowed: 38.5,
    bearingTopAllowed: 37.5,
    bearingBottomAllowed: 38,
  },
  {
    time: '23:24:00',
    windingA: 8,
    windingB: 10,
    windingC: 13,
    bearingTop: 31,
    bearingBottom: 21,
    windingAAllowed: 36,
    windingBAllowed: 36.5,
    windingCAllowed: 38.5,
    bearingTopAllowed: 37.5,
    bearingBottomAllowed: 38,
  },
  {
    time: '23:24:30',
    windingA: 4,
    windingB: 6,
    windingC: 3,
    bearingTop: 34,
    bearingBottom: 27,
    windingAAllowed: 36,
    windingBAllowed: 36.5,
    windingCAllowed: 38.5,
    bearingTopAllowed: 37.5,
    bearingBottomAllowed: 38,
  },
]

export const CURRENT_SERIES: LineChartSeries[] = [
  { key: 'phaseT', label: 'Dòng điện T', color: '#22c55e' },
  { key: 'phaseS', label: 'Dòng điện S', color: '#e879f9' },
  { key: 'phaseR', label: 'Dòng điện R', color: '#0d9488' },
  { key: 'phaseTAllowed', label: 'Dòng điện T cho phép', color: '#eab308', showDot: false },
  { key: 'phaseSAllowed', label: 'Dòng điện S cho phép', color: '#3b82f6', showDot: false },
  { key: 'phaseRAllowed', label: 'Dòng điện R cho phép', color: '#ef4444', showDot: false },
]

/** Mock data đồ thị dòng điện (interval 30s) */
export const CURRENT_CHART_DATA: LineChartPoint[] = [
  {
    time: '23:22:00',
    phaseT: 5,
    phaseS: 28,
    phaseR: 22,
    phaseTAllowed: 38,
    phaseSAllowed: 36,
    phaseRAllowed: 37,
  },
  {
    time: '23:22:30',
    phaseT: 12,
    phaseS: 26,
    phaseR: 20,
    phaseTAllowed: 38,
    phaseSAllowed: 36,
    phaseRAllowed: 37,
  },
  {
    time: '23:23:00',
    phaseT: 8,
    phaseS: 30,
    phaseR: 24,
    phaseTAllowed: 38,
    phaseSAllowed: 36,
    phaseRAllowed: 37,
  },
  {
    time: '23:23:30',
    phaseT: 18,
    phaseS: 27,
    phaseR: 21,
    phaseTAllowed: 38,
    phaseSAllowed: 36,
    phaseRAllowed: 37,
  },
  {
    time: '23:24:00',
    phaseT: 29,
    phaseS: 31,
    phaseR: 26,
    phaseTAllowed: 38,
    phaseSAllowed: 36,
    phaseRAllowed: 37,
  },
  {
    time: '23:24:30',
    phaseT: 6,
    phaseS: 34,
    phaseR: 23,
    phaseTAllowed: 38,
    phaseSAllowed: 36,
    phaseRAllowed: 37,
  },
]

export type ChartTabId = 'temperature' | 'current'
