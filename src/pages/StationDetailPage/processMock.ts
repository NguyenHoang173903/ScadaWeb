/** ViewBox — re-export layout cố định (không nằm trong data bơm). */
export { PROCESS_WIDTH, PROCESS_HEIGHT } from './processLayout'

export type ProcessPumpStatus = 'running' | 'error' | 'stopped' | 'unknown'

/** Màu fill cho phần vàng (#FFFF13) theo trạng thái runtime */
export const PROCESS_PUMP_COLORS: Record<ProcessPumpStatus, string> = {
  running: '#22c55e',
  error: '#ef4444',
  stopped: '#dc2626',
  unknown: '#FFFF13',
}

/** Data runtime / API — không chứa tọa độ SVG. */
export type ProcessPumpCard = {
  id: number
  label: string
  powerKw: number
  currentA: number
  runtimeH: number
  status: ProcessPumpStatus
}

/** Seed / fallback (layout xem processLayout.ts). */
export const PROCESS_PUMPS: ProcessPumpCard[] = [
  { id: 10, label: 'Bơm 10', powerKw: 160, currentA: 0, runtimeH: 130, status: 'stopped' },
  { id: 9, label: 'Bơm 9', powerKw: 160, currentA: 0, runtimeH: 130, status: 'error' },
  { id: 8, label: 'Bơm 8', powerKw: 160, currentA: 0, runtimeH: 130, status: 'running' },
  { id: 7, label: 'Bơm 7', powerKw: 160, currentA: 0, runtimeH: 130, status: 'stopped' },
  { id: 6, label: 'Bơm 6', powerKw: 160, currentA: 0, runtimeH: 130, status: 'running' },
  { id: 5, label: 'Bơm 5', powerKw: 160, currentA: 0, runtimeH: 130, status: 'stopped' },
  { id: 4, label: 'Bơm 4', powerKw: 160, currentA: 0, runtimeH: 130, status: 'running' },
  { id: 3, label: 'Bơm 3', powerKw: 160, currentA: 0, runtimeH: 130, status: 'stopped' },
  { id: 2, label: 'Bơm 2', powerKw: 160, currentA: 0, runtimeH: 130, status: 'unknown' },
  { id: 1, label: 'Bơm 1', powerKw: 160, currentA: 0, runtimeH: 130, status: 'unknown' },
]

export function formatOne(n: number) {
  return n.toFixed(1)
}

/** Đổi màu các path vàng của một bơm (SVG đã inline trong DOM) */
export function setProcessPumpColor(
  root: ParentNode,
  pumpId: number,
  color: string,
) {
  root
    .querySelectorAll(`[data-pump="${pumpId}"][data-part="yellow"]`)
    .forEach((el) => {
      el.setAttribute('fill', color)
    })
}

export function applyProcessPumpColors(
  root: ParentNode,
  pumps: Pick<ProcessPumpCard, 'id' | 'status'>[],
) {
  for (const pump of pumps) {
    setProcessPumpColor(root, pump.id, PROCESS_PUMP_COLORS[pump.status])
  }
}
