/**
 * Layout cố định sơ đồ công nghệ (sdcn_1.svg).
 * Tọa độ không thuộc data runtime / API — chỉ dùng khi render overlay.
 */

export const PROCESS_WIDTH = 1644
export const PROCESS_HEIGHT = 728

/**
 * Tâm icon bơm vàng (id 10 → 1, trái → phải) trong hệ toạ độ SVG.
 */
export const PROCESS_PUMP_X: Readonly<Record<number, number>> = {
  10: 103,
  9: 235,
  8: 373,
  7: 527,
  6: 665,
  5: 806,
  4: 942,
  3: 1080,
  2: 1234,
  1: 1371,
}

export const PROCESS_PUMP_ORDER = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1] as const

export function processPumpLeftPercent(pumpId: number): string | undefined {
  const x = PROCESS_PUMP_X[pumpId]
  if (x == null) return undefined
  return `${(x / PROCESS_WIDTH) * 100}%`
}
