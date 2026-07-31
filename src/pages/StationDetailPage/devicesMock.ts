export type DevicePumpStatus = 'running' | 'stopped' | 'error'

export const DEVICE_STATUS_META: Record<
  DevicePumpStatus,
  { label: string; color: string }
> = {
  running: { label: 'Bơm đang chạy', color: '#7CFC00' },
  stopped: { label: 'Bơm đang dừng', color: '#ef4444' },
  error: { label: 'Bơm đang lỗi', color: '#eab308' },
}

export type DevicePump = {
  id: number
  label: string
  powerKw: number
  status: DevicePumpStatus
  coilTempActual: [number, number, number]
  coilTempAllowed: [number, number, number]
  bearingTop: { actual: number; allowed: number }
  bearingBottom: { actual: number; allowed: number }
  waterRiverM: number
  waterBasinM: number
  runtimeInstant: string
  runtimeTotal: string
  voltageRs: number
  voltageSt: number
  voltageTr: number
  currentA: number
  powerFactor: number
  frequencyHz: number
  powerKwValue: number
  energyKwh: number
}

function basePump(id: number, status: DevicePumpStatus): DevicePump {
  return {
    id,
    label: `Bơm ${id}`,
    powerKw: 160,
    status,
    coilTempActual: [31, 32, 33],
    coilTempAllowed: [0, 0, 0],
    bearingTop: { actual: 0, allowed: 0 },
    bearingBottom: { actual: 0, allowed: 0 },
    waterRiverM: 0,
    waterBasinM: 0,
    runtimeInstant: status === 'running' ? "3h20'" : "0h0'",
    runtimeTotal: "348h50'",
    voltageRs: 0,
    voltageSt: 0,
    voltageTr: 0,
    currentA: 0,
    powerFactor: 0,
    frequencyHz: 0,
    powerKwValue: 0,
    energyKwh: 0,
  }
}

export const DEVICE_PUMPS: DevicePump[] = [
  basePump(1, 'running'),
  basePump(2, 'stopped'),
  basePump(3, 'running'),
  basePump(4, 'stopped'),
  basePump(5, 'error'),
  basePump(6, 'running'),
  basePump(7, 'stopped'),
  basePump(8, 'running'),
  basePump(9, 'stopped'),
  basePump(10, 'error'),
]

export function getDevicesByGroup(group: '1-5' | '6-10') {
  return group === '1-5'
    ? DEVICE_PUMPS.filter((p) => p.id >= 1 && p.id <= 5)
    : DEVICE_PUMPS.filter((p) => p.id >= 6 && p.id <= 10)
}

export function formatMetric(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}
