import { TriangleAlert } from 'lucide-react'
import styles from './StationAlertBar.module.css'

export type StationAlert = {
  time: string
  device: string
  message: string
}

type StationAlertBarProps = {
  count: number
  alerts: StationAlert[]
}

export function StationAlertBar({ count, alerts }: StationAlertBarProps) {
  if (count <= 0 || alerts.length === 0) {
    return null
  }

  const primary = alerts[0]

  return (
    <div className={styles.alert} role="status">
      <div className={styles.left}>
        <TriangleAlert size={18} />
        <strong>Lỗi ({count})</strong>
      </div>
      <div className={styles.details}>
        <span>{primary.time}</span>
        <span className={styles.divider} />
        <span>{primary.device}</span>
        <span className={styles.divider} />
        <span>{primary.message}</span>
      </div>
      <span className={styles.dot} aria-hidden="true" />
    </div>
  )
}
