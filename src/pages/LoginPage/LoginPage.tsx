import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  CloudRain,
  Droplets,
  Gauge,
  MapPinned,
} from 'lucide-react'
import { DashboardMap } from '@/components/map'
import type { MapOverlayLayer } from '@/components/map/layerTypes'
import { APP_COPYRIGHT, APP_SUPPORT_EMAIL, APP_VERSION } from '@/constants/config'
import { ROUTES } from '@/constants/routes'
import { getLoginLayerVisible } from '@/settings/loginLayerSettings'
import { resolveActiveMapLayer } from '@/services/mapLayers'
import { LoginForm } from './LoginForm'
import styles from './LoginPage.module.css'

const SERVICE_ITEMS = [
  { id: 'gis', lines: ['BẢN ĐỒ', 'GIS'], Icon: MapPinned },
  { id: 'level', lines: ['QUAN TRẮC', 'MỰC NƯỚC'], Icon: Gauge },
  { id: 'rain', lines: ['QUAN TRẮC', 'LƯỢNG MƯA'], Icon: CloudRain },
  { id: 'pump', lines: ['QUẢN LÝ HỆ', 'THỐNG THUỶ LỢI'], Icon: Droplets },
  { id: 'report', lines: ['BÁO CÁO', 'THỐNG KÊ'], Icon: BarChart3 },
  { id: 'alert', lines: ['CẢNH BÁO', 'SỰ KIỆN'], Icon: Bell },
] as const

export function LoginPage() {
  const navigate = useNavigate()
  const [layers, setLayers] = useState<MapOverlayLayer[]>([])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      if (!getLoginLayerVisible()) {
        setLayers([])
        return
      }

      try {
        const layer = await resolveActiveMapLayer()
        if (cancelled) return
        setLayers(layer ? [layer] : [])
      } catch {
        // Login page still works without the map layer.
      }
    })()

    return () => {
      cancelled = true
      // Do not revoke KMZ media here — owned by mapLayers memory cache.
    }
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.workspace}>
          <div className={styles.mapPane}>
            <DashboardMap layers={layers} />
          </div>

          <LoginForm
            onSubmit={() => {
              navigate(ROUTES.dashboard)
            }}
          />
        </div>

        <nav className={styles.services} aria-label="Dịch vụ hệ thống">
          {SERVICE_ITEMS.map(({ id, lines, Icon }) => (
            <button key={id} type="button" className={styles.serviceItem}>
              <span className={styles.serviceIcon}>
                <Icon size={22} strokeWidth={1.8} />
              </span>
              <span className={styles.serviceLabel}>
                {lines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </span>
            </button>
          ))}
        </nav>

        <footer className={styles.footer}>
          <span>{APP_COPYRIGHT}</span>
          <span>v{APP_VERSION}</span>
          <a href={`mailto:${APP_SUPPORT_EMAIL}`}>{APP_SUPPORT_EMAIL}</a>
        </footer>
      </div>
    </div>
  )
}
