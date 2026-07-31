import { useEffect, useMemo, useRef } from 'react'
import deviceSvgRaw from '@/assets/icons/device.svg?raw'
import { DEVICE_STATUS_META, type DevicePumpStatus } from './devicesMock'
import styles from './DevicesPage.module.css'

type DeviceIconProps = {
  status: DevicePumpStatus
}

export function DeviceIcon({ status }: DeviceIconProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const html = useMemo(
    () =>
      deviceSvgRaw
        .replace(/<\?xml[^>]*>/i, '')
        .replace(/<svg([^>]*)>/i, `<svg$1 class="${styles.deviceSvg}">`),
    [],
  )

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const color = DEVICE_STATUS_META[status].color
    host.querySelectorAll('.device-fill').forEach((el) => {
      el.setAttribute('fill', color)
    })
  }, [status, html])

  return (
    <div
      ref={hostRef}
      className={styles.deviceIcon}
      dangerouslySetInnerHTML={{ __html: html }}
      aria-hidden="true"
    />
  )
}
