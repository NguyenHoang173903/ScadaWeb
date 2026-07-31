/** Full viewBox of sdcn.svg */
export const PROCESS_WIDTH = 1776
export const PROCESS_HEIGHT = 727

export type ProcessPumpStatus = 'running' | 'error' | 'stopped' | 'unknown'

/** Màu fill cho phần vàng (#FFFF13) theo trạng thái runtime */
export const PROCESS_PUMP_COLORS: Record<ProcessPumpStatus, string> = {
  running: '#22c55e',
  error: '#ef4444',
  stopped: '#dc2626',
  unknown: '#FFFF13',
}

export type ProcessPumpCard = {
  id: number
  /** Center X in SVG coordinates */
  x: number
  label: string
  powerKw: number
  currentA: number
  runtimeH: number
  status: ProcessPumpStatus
}

/** Yellow pump icon centers from sdcn.svg */
export const PROCESS_PUMPS: ProcessPumpCard[] = [
  { id: 1, x: 236.1, label: 'Bơm 1', powerKw: 160, currentA: 0, runtimeH: 130, status: 'stopped' },
  { id: 2, x: 360.7, label: 'Bơm 2', powerKw: 160, currentA: 0, runtimeH: 130, status: 'error' },
  { id: 3, x: 506.0, label: 'Bơm 3', powerKw: 160, currentA: 0, runtimeH: 130, status: 'running' },
  { id: 4, x: 660.4, label: 'Bơm 4', powerKw: 160, currentA: 0, runtimeH: 130, status: 'stopped' },
  { id: 5, x: 798.0, label: 'Bơm 5', powerKw: 160, currentA: 0, runtimeH: 130, status: 'running' },
  { id: 6, x: 939.4, label: 'Bơm 6', powerKw: 160, currentA: 0, runtimeH: 130, status: 'stopped' },
  { id: 7, x: 1074.0, label: 'Bơm 7', powerKw: 160, currentA: 0, runtimeH: 130, status: 'running' },
  { id: 8, x: 1213.0, label: 'Bơm 8', powerKw: 160, currentA: 0, runtimeH: 130, status: 'stopped' },
  { id: 9, x: 1367.0, label: 'Bơm 9', powerKw: 160, currentA: 0, runtimeH: 130, status: 'unknown' },
  { id: 10, x: 1501.0, label: 'Bơm 10', powerKw: 160, currentA: 0, runtimeH: 130, status: 'unknown' },
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
