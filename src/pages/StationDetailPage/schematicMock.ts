/** Full viewBox width of sdnl_3.svg — used for % left positions */
export const SCHEMATIC_WIDTH = 1645
export const SCHEMATIC_HEIGHT = 683

/** Trạng thái khối M (+ thẻ / chú thích tổng) */
export type MotorStatus =
  | 'running'
  | 'error'
  | 'stopped'
  | 'maintenance'
  | 'unknown'

/** Trạng thái khối KĐM — độc lập với M (không có xám / bảo trì) */
export type KdmStatus = 'running' | 'error' | 'stopped'

/** Khoá điện trên feeder — 2 hình đóng / mở */
export type LockStatus = 'closed' | 'open'

/** @deprecated dùng MotorStatus — giữ alias cho chỗ còn gọi PumpStatus */
export type PumpStatus = MotorStatus

export type PumpBranch = {
  id: number
  /** Center X in SVG coordinates */
  x: number
  label: string
  powerKw: number
  /** Trạng thái khối M */
  motorStatus: MotorStatus
  /** Trạng thái khối KĐM (độc lập) */
  kdmStatus: KdmStatus
  /** Khoá điện: closed = X trên đường liền, open = dao cắt */
  lockStatus: LockStatus
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

/**
 * Ràng buộc: M đang bảo trì thì KĐM không được xanh (running) → ép đỏ (stopped).
 */
export function resolveKdmStatus(
  motorStatus: MotorStatus,
  kdmStatus: KdmStatus,
): KdmStatus {
  if (motorStatus === 'maintenance' && kdmStatus === 'running') {
    return 'stopped'
  }
  return kdmStatus
}

type PumpMeasures = Omit<
  PumpBranch,
  'id' | 'x' | 'label' | 'powerKw' | 'motorStatus' | 'kdmStatus' | 'lockStatus'
>

const DEFAULT_MEASURES: PumpMeasures = {
  i1: 0,
  i2: 0,
  i3: 0,
  v1: 414.5,
  v2: 412.7,
  v3: 415.8,
  currentA: 0,
  runtimeH: 20,
}

function branch(
  id: number,
  x: number,
  motorStatus: MotorStatus,
  kdmStatus: KdmStatus,
  lockStatus: LockStatus,
): PumpBranch {
  return {
    id,
    x,
    label: `Bơm ${id}`,
    powerKw: 160,
    motorStatus,
    kdmStatus,
    lockStatus,
    ...DEFAULT_MEASURES,
  }
}

/**
 * Màu / trạng thái mock — KĐM, M, khoá độc lập.
 * Bơm 10→6: khoá đóng; 5→1: khoá mở.
 */
export const PUMP_BRANCHES: PumpBranch[] = [
  branch(10, 133.26, 'stopped', 'stopped', 'open'),
  branch(9, 297.26, 'error', 'error', 'closed'),
  branch(8, 461.46, 'running', 'running', 'closed'),
  branch(7, 626.26, 'stopped', 'stopped', 'closed'),
  branch(6, 789.46, 'maintenance', 'stopped', 'closed'),
  branch(5, 954.26, 'stopped', 'stopped', 'open'),
  branch(4, 1118.26, 'error', 'error', 'open'),
  branch(3, 1294.26, 'stopped', 'stopped', 'open'),
  branch(2, 1448.26, 'unknown', 'stopped', 'open'),
  branch(1, 1612.26, 'unknown', 'stopped', 'open'),
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

export const SCHEMATIC_KDM_COLORS: Record<KdmStatus, string> = {
  running: '#1FED7E',
  error: '#FFE100',
  stopped: '#FF4848',
}

/** 5 stop radial của khối M — giữ gradient như SVG gốc */
export const SCHEMATIC_MOTOR_RADIAL: Record<
  MotorStatus,
  readonly [string, string, string, string, string]
> = {
  running: ['#79FFC0', '#58EAA3', '#39CF83', '#1EA45B', '#0B6F37'],
  error: ['#FDFF79', '#E8EA58', '#CFC039', '#A4871E', '#6F650B'],
  stopped: ['#FF7979', '#EA5858', '#CF3939', '#A41E1E', '#6F0B0B'],
  maintenance: ['#6F9AD3', '#689FE5', '#3F85DF', '#226FD3', '#0452B8'],
  unknown: ['#D8D4D5', '#C5C0C1', '#ABA6A7', '#8E8A8B', '#6A6667'],
}

const MOTOR_RADIAL_OFFSETS = [undefined, '0.28', '0.55', '0.8', '1'] as const

function ensureMotorRadialGradient(
  svg: SVGSVGElement,
  motorEl: Element,
): SVGRadialGradientElement | null {
  const fill = motorEl.getAttribute('fill') || ''
  const urlMatch = fill.match(/^url\(#([^)]+)\)$/)
  if (urlMatch) {
    return svg.querySelector(`#${CSS.escape(urlMatch[1])}`)
  }

  const pumpId = motorEl.getAttribute('data-pump') || 'x'
  const gradId = `pump-${pumpId}-motor-radial`
  let grad = svg.querySelector(
    `#${CSS.escape(gradId)}`,
  ) as SVGRadialGradientElement | null
  if (!grad) {
    const d = motorEl.getAttribute('d') || ''
    const cm = d.match(/^M([0-9.]+)\s+([0-9.]+)/)
    const cx = cm ? Number(cm[1]) : 0
    const bottomY = cm ? Number(cm[2]) : 0
    const cy = bottomY - 27.26

    const defs =
      svg.querySelector('defs') ??
      svg.appendChild(
        document.createElementNS('http://www.w3.org/2000/svg', 'defs'),
      )
    grad = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'radialGradient',
    )
    grad.setAttribute('id', gradId)
    grad.setAttribute('cx', '0')
    grad.setAttribute('cy', '0')
    grad.setAttribute('r', '1')
    grad.setAttribute('gradientUnits', 'userSpaceOnUse')
    grad.setAttribute(
      'gradientTransform',
      `translate(${cx} ${cy}) scale(38.164)`,
    )
    for (const offset of MOTOR_RADIAL_OFFSETS) {
      const stop = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'stop',
      )
      if (offset) stop.setAttribute('offset', offset)
      grad.appendChild(stop)
    }
    defs.appendChild(grad)
  }
  motorEl.setAttribute('fill', `url(#${gradId})`)
  return grad
}

function applyMotorRadialStops(
  grad: SVGRadialGradientElement,
  status: MotorStatus,
) {
  const colors = SCHEMATIC_MOTOR_RADIAL[status]
  let stops = grad.querySelectorAll('stop')
  if (stops.length < 5) {
    for (let i = stops.length; i < 5; i++) {
      const stop = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'stop',
      )
      const offset = MOTOR_RADIAL_OFFSETS[i]
      if (offset) stop.setAttribute('offset', offset)
      grad.appendChild(stop)
    }
    stops = grad.querySelectorAll('stop')
  }
  stops.forEach((stop, i) => {
    if (i < colors.length) stop.setAttribute('stop-color', colors[i])
  })
}

export function setSchematicPumpColors(
  root: ParentNode,
  pumpId: number,
  motorStatus: MotorStatus,
  kdmStatus: KdmStatus,
) {
  const kdm = SCHEMATIC_KDM_COLORS[resolveKdmStatus(motorStatus, kdmStatus)]

  root
    .querySelectorAll(
      `[data-pump="${pumpId}"][data-part="mccb"], [data-pump="${pumpId}"][data-part="mccb-mark"]`,
    )
    .forEach((el) => {
      el.setAttribute('stroke', kdm)
    })

  root
    .querySelectorAll(`[data-pump="${pumpId}"][data-part="motor"]`)
    .forEach((el) => {
      const hostSvg = el.closest('svg') as SVGSVGElement | null
      if (!hostSvg) return
      const grad = ensureMotorRadialGradient(hostSvg, el)
      if (grad) applyMotorRadialStops(grad, motorStatus)
    })
}

/** Bật đúng nhóm khoá đóng/mở (2 biến thể hình trong SVG). */
export function setSchematicLockState(
  root: ParentNode,
  pumpId: number,
  lockStatus: LockStatus,
) {
  root
    .querySelectorAll(`[data-pump="${pumpId}"][data-part="lock"]`)
    .forEach((el) => {
      const show = el.getAttribute('data-lock') === lockStatus
      el.setAttribute('visibility', show ? 'visible' : 'hidden')
    })
}

export function applySchematicPumpColors(
  root: ParentNode,
  pumps: Pick<PumpBranch, 'id' | 'motorStatus' | 'kdmStatus' | 'lockStatus'>[],
) {
  for (const pump of pumps) {
    setSchematicPumpColors(
      root,
      pump.id,
      pump.motorStatus,
      pump.kdmStatus,
    )
    setSchematicLockState(root, pump.id, pump.lockStatus)
  }
}

export function formatOne(n: number) {
  return n.toFixed(1)
}

export function formatTwo(n: number) {
  return n.toFixed(2)
}
