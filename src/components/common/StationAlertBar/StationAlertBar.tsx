import { memo, useEffect, useRef, useState } from 'react'
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

function useMobileTicker() {
  // Phones + portrait tablets.
  const query = "(max-width: 1023px)"
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setMobile(media.matches)
    onChange()
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])

  return mobile
}

function alertsSignature(alerts: StationAlert[]) {
  return alerts
    .map((alert) => `${alert.time}\u0000${alert.device}\u0000${alert.message}`)
    .join('\u0001')
}

function StationAlertBarView({ count, alerts }: StationAlertBarProps) {
  const tickerRef = useRef<HTMLDivElement>(null)
  const [tickerWidth, setTickerWidth] = useState(0)
  const mobileTicker = useMobileTicker()
  const hasAlerts = alerts.length > 0

  useEffect(() => {
    if (!hasAlerts) return
    const ticker = tickerRef.current
    if (!ticker) return

    const observer = new ResizeObserver(([entry]) => {
      setTickerWidth(entry.contentRect.width)
    })
    observer.observe(ticker)
    return () => observer.disconnect()
  }, [hasAlerts])

  if (count <= 0 || alerts.length === 0) {
    return null
  }

  const alertSignature = alertsSignature(alerts)
  const shouldAnimate = mobileTicker || count > 3

  return (
    <div
      className={shouldAnimate ? `${styles.alert} ${styles.alertAnimated}` : styles.alert}
      role="status"
    >
      <div className={styles.left}>
        <TriangleAlert size={18} />
        <strong>Lỗi ({count})</strong>
      </div>
      <span className={styles.divider} />
      <div className={styles.details} ref={tickerRef}>
        <div
          className={`${styles.ticker} ${shouldAnimate ? styles.tickerAnimated : styles.tickerStatic}`}
          key={`${alertSignature}-${shouldAnimate}`}
        >
          {(shouldAnimate ? [false, true] : [false]).map((isDuplicate) => (
            <div
              className={styles.tickerGroup}
              key={String(isDuplicate)}
              aria-hidden={isDuplicate || undefined}
              style={
                shouldAnimate ? { minWidth: tickerWidth || undefined } : undefined
              }
            >
              {alerts.map((alert, index) => (
                <div className={styles.item} key={`${index}-${alert.time}-${alert.device}`}>
                  {index > 0 ? <span className={styles.divider} /> : null}
                  <span className={styles.dot} aria-hidden="true" />
                  <span>{alert.message}</span>
                  <span className={styles.divider} />
                  <span>{alert.device}</span>
                  <span className={styles.divider} />
                  <span>{alert.time}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Periodic refetches return new arrays with the same errors; skip re-rendering
 * (and touching the running marquee) unless the visible content changed.
 */
export const StationAlertBar = memo(
  StationAlertBarView,
  (prev, next) =>
    prev.count === next.count && alertsSignature(prev.alerts) === alertsSignature(next.alerts),
)
