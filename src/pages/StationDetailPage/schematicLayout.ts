/**
 * Layout cố định sơ đồ nguyên lý (sdnl_3.svg).
 * Tọa độ không thuộc data runtime / API — chỉ dùng khi render overlay.
 */

/** Full viewBox width — dùng tính % left */
export const SCHEMATIC_WIDTH = 1645
export const SCHEMATIC_HEIGHT = 683

/**
 * Tâm cột từng bơm (id 10 → 1, trái → phải) trong hệ toạ độ SVG.
 * Khớp vị trí feeder trên sdnl_3.svg.
 */
export const SCHEMATIC_PUMP_X: Readonly<Record<number, number>> = {
  10: 133.26,
  9: 297.26,
  8: 461.46,
  7: 626.26,
  6: 789.46,
  5: 954.26,
  4: 1118.26,
  3: 1294.26,
  2: 1448.26,
  1: 1612.26,
}

/** Thứ tự render overlay (trái → phải). */
export const SCHEMATIC_PUMP_ORDER = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1] as const

/** % left CSS cho overlay (lệch nhẹ so với tâm cột). */
export function schematicPumpLeftPercent(pumpId: number): string | undefined {
  const x = SCHEMATIC_PUMP_X[pumpId]
  if (x == null) return undefined
  return `${(x / SCHEMATIC_WIDTH) * 100 - 2.5}%`
}
