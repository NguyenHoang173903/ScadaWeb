import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/common/Button'
import { FormField } from '@/components/common/FormField'
import { TextField } from '@/components/common/TextField'
import { isApiError } from '@/services/api/http'
import {
  fetchFrontendConfig,
  updateFrontendConfig,
} from '@/services/frontendConfig/frontendConfigApi'
import {
  applyServerRuntimeConfig,
  getCurrentDashboardMapView,
  getRuntimeConfig,
  getRuntimeConfigSource,
} from '@/settings/runtimeConfig'
import styles from './PasswordPolicyForm.module.css'

const SOURCE_LABEL = {
  server: 'cơ sở dữ liệu backend',
  env: 'biến môi trường (.env)',
  default: 'giá trị mặc định tạm thời (test)',
  none: 'chưa thiết lập',
} as const

export function SystemConfigForm() {
  const [apiBaseUrl, setApiBaseUrl] = useState(() => getRuntimeConfig().apiBaseUrl)
  const [mapZoom, setMapZoom] = useState('2')
  const [mapOffsetX, setMapOffsetX] = useState('0')
  const [mapOffsetY, setMapOffsetY] = useState('0')
  const [savedMapView, setSavedMapView] = useState({
    zoom: 2,
    offsetX: 0,
    offsetY: 0,
  })
  const [source, setSource] = useState(() => getRuntimeConfigSource())
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const remote = await fetchFrontendConfig()
        if (cancelled) return
        applyServerRuntimeConfig(remote)
        const runtime = getRuntimeConfig()
        const databaseView = {
          zoom: runtime.dashboardMapZoom,
          offsetX: runtime.dashboardMapOffsetX,
          offsetY: runtime.dashboardMapOffsetY,
        }
        const currentView = getCurrentDashboardMapView() ?? databaseView
        setSavedMapView(databaseView)
        setMapZoom(String(currentView.zoom))
        setMapOffsetX(String(currentView.offsetX))
        setMapOffsetY(String(currentView.offsetY))
        setApiBaseUrl(getRuntimeConfig().apiBaseUrl)
        setSource(getRuntimeConfigSource())
      } catch (requestError) {
        if (!cancelled) {
          setError(
            isApiError(requestError)
              ? requestError.message
              : 'Không tải được cấu hình frontend từ máy chủ.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const zoom = Number(mapZoom)
    const offsetX = Number(mapOffsetX)
    const offsetY = Number(mapOffsetY)
    if (!Number.isFinite(zoom) || zoom < 1 || zoom > 4) {
      setError('Mức phóng bản đồ phải nằm trong khoảng từ 1 đến 4.')
      setSaved(false)
      return
    }
    if (
      !Number.isFinite(offsetX) ||
      !Number.isFinite(offsetY) ||
      Math.abs(offsetX) > 5000 ||
      Math.abs(offsetY) > 5000
    ) {
      setError('Tọa độ X và Y phải nằm trong khoảng từ -5000 đến 5000.')
      setSaved(false)
      return
    }

    setError('')
    setSaved(false)
    setLoading(true)
    void (async () => {
      try {
        const remote = await updateFrontendConfig({
          dashboardMapZoom: zoom,
          dashboardMapOffsetX: offsetX,
          dashboardMapOffsetY: offsetY,
        })
        applyServerRuntimeConfig(remote)
        const runtime = getRuntimeConfig()
        const savedView = {
          zoom: runtime.dashboardMapZoom,
          offsetX: runtime.dashboardMapOffsetX,
          offsetY: runtime.dashboardMapOffsetY,
        }
        setSavedMapView(savedView)
        setMapZoom(String(savedView.zoom))
        setMapOffsetX(String(savedView.offsetX))
        setMapOffsetY(String(savedView.offsetY))
        setSource(getRuntimeConfigSource())
        setSaved(true)
      } catch (requestError) {
        setError(
          isApiError(requestError)
            ? requestError.message
            : 'Không lưu được cấu hình frontend lên máy chủ.',
        )
      } finally {
        setLoading(false)
      }
    })()
  }

  const numericMapView = {
    zoom: Number(mapZoom),
    offsetX: Number(mapOffsetX),
    offsetY: Number(mapOffsetY),
  }
  const mapViewChanged =
    Number.isFinite(numericMapView.zoom) &&
    Number.isFinite(numericMapView.offsetX) &&
    Number.isFinite(numericMapView.offsetY) &&
    (numericMapView.zoom !== savedMapView.zoom ||
      numericMapView.offsetX !== savedMapView.offsetX ||
      numericMapView.offsetY !== savedMapView.offsetY)

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.panel}>
        <h3 className={styles.heading}>Thông tin xác thực và kết nối</h3>
        <p className={styles.hint}>
          Bí mật và endpoint không được hardcode trong mã nguồn. Thiết lập tại đây hoặc qua file
          môi trường. URL API là cấu hình khởi động của máy FE; vị trí bản đồ được lưu trong DB.
        </p>

        <div className={styles.grid}>
          <FormField label="URL API backend" htmlFor="apiBaseUrl" required>
            <TextField
              id="apiBaseUrl"
              name="apiBaseUrl"
              value={apiBaseUrl}
              autoComplete="off"
              disabled
              required
            />
          </FormField>
          <FormField
            label="Vị trí mặc định bản đồ (Tọa độ hiện tại)"
            htmlFor="dashboardMapPosition"
          >
            <TextField
              id="dashboardMapPosition"
              value={`(${mapOffsetX}, ${mapOffsetY}), ${mapZoom}`}
              readOnly
            />
          </FormField>
        </div>

        <p className={styles.hint}>
          URL API đang lấy từ {SOURCE_LABEL[source.apiBaseUrl]}. Các thông số trên là vị trí gần
          nhất tại Dashboard; chỉ có thể lưu khi khác vị trí đang có trong DB.
        </p>
      </div>

      <div className={styles.actions}>
        {error ? (
          <p className={styles.error}>{error}</p>
        ) : saved ? (
          <p className={styles.success}>Đã lưu cấu hình hệ thống.</p>
        ) : (
          <span />
        )}
        <Button type="submit" variant="success" disabled={loading || !mapViewChanged}>
          {loading ? 'Đang xử lý...' : 'Lưu cấu hình'}
        </Button>
      </div>
    </form>
  )
}
