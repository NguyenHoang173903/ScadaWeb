/** ViewBox width of sdnl.svg — used for % left positions */
export const SCHEMATIC_WIDTH = 1637

export type PumpStatus = 'running' | 'error' | 'stopped' | 'unknown'

export type PumpBranch = {
  id: number
  /** Center X in SVG coordinates */
  x: number
  label: string
  powerKw: number
  status: PumpStatus
  i1: number
  i2: number
  i3: number
  v1: number
  v2: number
  v3: number
  currentA: number
  runtimeH: number
}

export type ElectricalParams = {
  voltageRs: number
  voltageSt: number
  voltageRt: number
  current: number
  powerFactor: number
  frequency: number
  powerKw: number
  energyKwh: number
}

/** Column centers from sdnl.svg motor / feeder lines */
export const PUMP_BRANCHES: PumpBranch[] = [
  {
    id: 1,
    x: 130.26,
    label: 'Bơm 1',
    powerKw: 160,
    status: 'stopped',
    i1: 0,
    i2: 0,
    i3: 0,
    v1: 414.5,
    v2: 412.7,
    v3: 415.8,
    currentA: 0,
    runtimeH: 20,
  },
  {
    id: 2,
    x: 293.46,
    label: 'Bơm 2',
    powerKw: 160,
    status: 'error',
    i1: 0,
    i2: 0,
    i3: 0,
    v1: 414.5,
    v2: 412.7,
    v3: 415.8,
    currentA: 0,
    runtimeH: 20,
  },
  {
    id: 3,
    x: 457.46,
    label: 'Bơm 3',
    powerKw: 160,
    status: 'running',
    i1: 0,
    i2: 0,
    i3: 0,
    v1: 414.5,
    v2: 412.7,
    v3: 415.8,
    currentA: 0,
    runtimeH: 20,
  },
  {
    id: 4,
    x: 622.26,
    label: 'Bơm 4',
    powerKw: 160,
    status: 'stopped',
    i1: 0,
    i2: 0,
    i3: 0,
    v1: 414.5,
    v2: 412.7,
    v3: 415.8,
    currentA: 0,
    runtimeH: 20,
  },
  {
    id: 5,
    x: 785.46,
    label: 'Bơm 5',
    powerKw: 160,
    status: 'running',
    i1: 0,
    i2: 0,
    i3: 0,
    v1: 414.5,
    v2: 412.7,
    v3: 415.8,
    currentA: 0,
    runtimeH: 20,
  },
  {
    id: 6,
    x: 950.26,
    label: 'Bơm 6',
    powerKw: 160,
    status: 'stopped',
    i1: 0,
    i2: 0,
    i3: 0,
    v1: 414.5,
    v2: 412.7,
    v3: 415.8,
    currentA: 0,
    runtimeH: 20,
  },
  {
    id: 7,
    x: 1115.46,
    label: 'Bơm 7',
    powerKw: 160,
    status: 'stopped',
    i1: 0,
    i2: 0,
    i3: 0,
    v1: 414.5,
    v2: 412.7,
    v3: 415.8,
    currentA: 0,
    runtimeH: 20,
  },
  {
    id: 8,
    x: 1290.26,
    label: 'Bơm 8',
    powerKw: 160,
    status: 'stopped',
    i1: 0,
    i2: 0,
    i3: 0,
    v1: 414.5,
    v2: 412.7,
    v3: 415.8,
    currentA: 0,
    runtimeH: 20,
  },
  {
    id: 9,
    x: 1444.26,
    label: 'Bơm 9',
    powerKw: 160,
    status: 'unknown',
    i1: 0,
    i2: 0,
    i3: 0,
    v1: 414.5,
    v2: 412.7,
    v3: 415.8,
    currentA: 0,
    runtimeH: 20,
  },
  {
    id: 10,
    x: 1608.26,
    label: 'Bơm 10',
    powerKw: 160,
    status: 'unknown',
    i1: 0,
    i2: 0,
    i3: 0,
    v1: 414.5,
    v2: 412.7,
    v3: 415.8,
    currentA: 0,
    runtimeH: 20,
  },
]

export const ELECTRICAL_PARAMS: ElectricalParams = {
  voltageRs: 0,
  voltageSt: 0,
  voltageRt: 0,
  current: 0,
  powerFactor: 0,
  frequency: 0,
  powerKw: 0,
  energyKwh: 0,
}

export function formatOne(n: number) {
  return n.toFixed(1)
}

export function formatTwo(n: number) {
  return n.toFixed(2)
}
