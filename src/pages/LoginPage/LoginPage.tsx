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
import {
  DEFAULT_CANAL_LAYER_ID,
  DEFAULT_LAYER_STYLE,
  type MapOverlayLayer,
} from '@/components/map/layerTypes'
import { parseLayerUrl } from '@/components/map/parseLayerFile'
import { APP_COPYRIGHT, APP_SUPPORT_EMAIL, APP_VERSION } from '@/constants/config'
import { ROUTES } from '@/constants/routes'
import { getLoginLayerVisible } from '@/settings/loginLayerSettings'
import { LoginForm } from './LoginForm'
import styles from './LoginPage.module.css'

const DEFAULT_MEDIA_BASE = '/layers/hethongkenh/'

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
        const geojson = await parseLayerUrl('/layers/hethongkenh.kml')
        if (cancelled) return

        setLayers([
          {
            id: DEFAULT_CANAL_LAYER_ID,
            name: 'Hệ thống kênh',
            geojson,
            visible: true,
            opacity: DEFAULT_LAYER_STYLE.opacity,
            weight: DEFAULT_LAYER_STYLE.weight,
            color: DEFAULT_LAYER_STYLE.color,
            mediaBaseUrl: DEFAULT_MEDIA_BASE,
          },
        ])
      } catch {
        // Login page still works without the map layer.
      }
    })()

    return () => {
      cancelled = true
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
                <Icon size={22} />
              </span>
              <span className={styles.serviceLabel}>
                {lines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <footer className={styles.footer}>
        <span>Version {APP_VERSION}</span>
        <span>{APP_COPYRIGHT}</span>
        <a href={`mailto:${APP_SUPPORT_EMAIL}`}>{APP_SUPPORT_EMAIL}</a>
      </footer>
    </div>
  )
}
