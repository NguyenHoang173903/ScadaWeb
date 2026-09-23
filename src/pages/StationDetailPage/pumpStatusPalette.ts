/** Canonical pump statuses and colors shared by every station screen. */
export type PumpVisualStatus =
  | 'running'
  | 'error'
  | 'stopped'
  | 'maintenance'
  | 'unknown'

/**
 * Colors match the middle stop of the motor gradient in the schematic:
 * running=green, error=yellow, stopped=red, maintenance=blue, unknown=gray.
 */
export const PUMP_STATUS_COLORS: Record<PumpVisualStatus, string> = {
  running: '#39CF83',
  error: '#CFC039',
  stopped: '#CF3939',
  maintenance: '#3F85DF',
  unknown: '#ABA6A7',
}
