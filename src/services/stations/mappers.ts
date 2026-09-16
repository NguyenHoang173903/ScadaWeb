import type { DevicePump, DevicePumpStatus } from '@/pages/StationDetailPage/devicesMock'
import type {
  ElectricalParams,
  KdmStatus,
  LockStatus,
  MotorStatus,
  PumpBranch,
} from '@/pages/StationDetailPage/schematicMock'
import type { ProcessPumpCard, ProcessPumpStatus } from '@/pages/StationDetailPage/processMock'
import type { PumpStation } from '@/data/pumpStations'
import type {
  DeviceMonitorItemDto,
  SchematicPumpDto,
  StationDetailDto,
  StationElectricalDto,
} from './stationsApi'

function num(value: number | null | undefined, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function formatRuntime(hours: number | null | undefined) {
  const h = num(hours)
  const whole = Math.floor(h)
  const minutes = Math.round((h - whole) * 60)
  return `${whole}h${minutes}'`
}

function asDeviceStatus(status: string): DevicePumpStatus {
  if (status === 'running' || status === 'stopped' || status === 'error') return status
  if (status === 'maintenance') return 'maintenance'
  return 'unknown'
}

function asMotorStatus(status: string): MotorStatus {
  if (
    status === 'running' ||
    status === 'stopped' ||
    status === 'error' ||
    status === 'maintenance' ||
    status === 'unknown'
  ) {
    return status
  }
  return 'unknown'
}

function asKdmStatus(status: string): KdmStatus {
  if (status === 'running' || status === 'stopped' || status === 'error') return status
  return 'stopped'
}

function asLockStatus(status: string): LockStatus {
  return status === 'closed' ? 'closed' : 'open'
}

function asProcessStatus(status: string): ProcessPumpStatus {
  if (status === 'running' || status === 'stopped' || status === 'error') return status
  return 'unknown'
}

/** Parse chỉ số bơm 1..10 từ tên/code (Pump3, Bơm 3, …). */
export function parsePumpIndex(name?: string | null, code?: string | null): number | null {
  const hay = `${name ?? ''} ${code ?? ''}`.trim()
  if (!hay) return null
  const patterns = [
    /(?:pump|bơm|bom)\s*[#:_-]?\s*(\d{1,2})/i,
    /^(\d{1,2})\b/,
  ]
  for (const re of patterns) {
    const m = hay.match(re)
    if (!m) continue
    const n = Number(m[1])
    if (Number.isInteger(n) && n >= 1 && n <= 10) return n
  }
  return null
}

export function stationDetailToPumpStation(dto: StationDetailDto): PumpStation {
  return {
    id: String(dto.id),
    name: dto.name,
    code: dto.code,
    address: dto.address?.trim() || '—',
    status: dto.isActive ? 'Đang hoạt động' : 'Ngưng hoạt động',
    pumps: 0,
    capacity: '—',
    lat: dto.latitude ?? 0,
    lng: dto.longitude ?? 0,
  }
}

export function mapDeviceMonitorItem(item: DeviceMonitorItemDto): DevicePump {
  const e = item.electrical
  const fromApi =
    typeof item.pumpIndex === 'number' &&
    Number.isInteger(item.pumpIndex) &&
    item.pumpIndex >= 1 &&
    item.pumpIndex <= 10
      ? item.pumpIndex
      : null
  const pumpIndex = fromApi ?? parsePumpIndex(item.name, item.code) ?? 0
  return {
    id: item.deviceId,
    pumpIndex,
    label: item.name,
    powerKw: num(item.ratedPowerKw, 0),
    status: asDeviceStatus(item.status),
    coilTempActual: [
      num(item.windingTempActual.a),
      num(item.windingTempActual.b),
      num(item.windingTempActual.c),
    ],
    coilTempAllowed: [
      num(item.windingTempAllowed.a),
      num(item.windingTempAllowed.b),
      num(item.windingTempAllowed.c),
    ],
    bearingTop: {
      actual: num(item.bearingTop.actual),
      allowed: num(item.bearingTop.allowed),
    },
    bearingBottom: {
      actual: num(item.bearingBottom.actual),
      allowed: num(item.bearingBottom.allowed),
    },
    waterRiverM: num(item.waterLevel.river),
    waterBasinM: num(item.waterLevel.basin),
    runtimeInstant: formatRuntime(item.runtime.instantH),
    runtimeTotal: formatRuntime(item.runtime.totalH),
    voltageRs: num(e.voltageRs),
    voltageSt: num(e.voltageSt),
    voltageTr: num(e.voltageTr),
    currentA: num(e.currentA),
    powerFactor: num(e.powerFactor),
    frequencyHz: num(e.frequencyHz),
    powerKwValue: num(e.powerKw),
    energyKwh: num(e.energyKwh),
  }
}

/** Ghép trạng thái / đo từ API lên seed theo id bơm (1..10). Layout SVG tách riêng. */
export function mapSchematicPumps(
  apiPumps: SchematicPumpDto[],
  seedBranches: PumpBranch[],
): PumpBranch[] {
  const byId = new Map(apiPumps.map((p) => [p.id, p]))
  return seedBranches.map((branch) => {
    const api = byId.get(branch.id)
    if (!api) return branch
    return {
      ...branch,
      label: api.label || branch.label,
      powerKw: api.powerKw || branch.powerKw,
      motorStatus: asMotorStatus(api.motorStatus),
      kdmStatus: asKdmStatus(api.kdmStatus),
      lockStatus: asLockStatus(api.lockStatus),
      i1: num(api.i1, branch.i1),
      i2: num(api.i2, branch.i2),
      i3: num(api.i3, branch.i3),
      v1: num(api.v1, branch.v1),
      v2: num(api.v2, branch.v2),
      v3: num(api.v3, branch.v3),
      currentA: num(api.currentA, branch.currentA),
      runtimeH: num(api.runtimeH, branch.runtimeH),
    }
  })
}

export function mapProcessPumps(
  apiPumps: SchematicPumpDto[],
  seedPumps: ProcessPumpCard[],
): ProcessPumpCard[] {
  const byId = new Map(apiPumps.map((p) => [p.id, p]))
  return seedPumps.map((pump) => {
    const api = byId.get(pump.id)
    if (!api) return pump
    return {
      ...pump,
      label: api.label || pump.label,
      powerKw: api.powerKw || pump.powerKw,
      currentA: num(api.currentA, pump.currentA),
      runtimeH: num(api.runtimeH, pump.runtimeH),
      status: asProcessStatus(api.motorStatus),
    }
  })
}

export function mapElectricalParams(
  dto: StationElectricalDto,
  fallback: ElectricalParams,
): ElectricalParams {
  const params = dto.items[0]?.parameters ?? []
  const pick = (key: string) => params.find((p) => p.key === key)?.value

  return {
    voltageRs: num(pick('voltageRs'), fallback.voltageRs),
    voltageSt: num(pick('voltageSt'), fallback.voltageSt),
    voltageRt: num(pick('voltageTr') ?? pick('voltageRt'), fallback.voltageRt),
    current: num(pick('currentA') ?? pick('current'), fallback.current),
    powerFactor: num(pick('powerFactor'), fallback.powerFactor),
    frequency: num(pick('frequencyHz') ?? pick('frequency'), fallback.frequency),
    powerKw: num(pick('powerKw'), fallback.powerKw),
    energyKwh: num(pick('energyKwh'), fallback.energyKwh),
  }
}
