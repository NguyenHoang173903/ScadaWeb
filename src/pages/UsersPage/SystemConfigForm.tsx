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
  getRuntimeConfig,
  getRuntimeConfigSource,
} from '@/settings/runtimeConfig'
import { validateSecretKey } from '@/validation'
import styles from './PasswordPolicyForm.module.css'

const SOURCE_LABEL = {
  server: 'cơ sở dữ liệu backend',
  env: 'biến môi trường (.env)',
  default: 'giá trị mặc định tạm thời (test)',
  none: 'chưa thiết lập',
} as const

export function SystemConfigForm() {
  const [apiBaseUrl, setApiBaseUrl] = useState(() => getRuntimeConfig().apiBaseUrl)
  const [arcgisApiKey, setArcgisApiKey] = useState('')
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
        applyServerRuntimeConfig({ arcgisApiKey: remote.arcgisApiKey })
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
    const keyToSave = arcgisApiKey.trim()
    const check = keyToSave
      ? validateSecretKey(keyToSave, 'Khóa ArcGIS', 16)
      : { ok: true as const }
    if (!check.ok) {
      setError(check.message)
      setSaved(false)
      return
    }

    setError('')
    setSaved(false)
    setLoading(true)
    void (async () => {
      try {
        const remote = await updateFrontendConfig(
          keyToSave ? { arcgisApiKey: keyToSave } : {},
        )
        applyServerRuntimeConfig({ arcgisApiKey: remote.arcgisApiKey })
        setArcgisApiKey('')
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

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.panel}>
        <h3 className={styles.heading}>Thông tin xác thực và kết nối</h3>
        <p className={styles.hint}>
          Bí mật và endpoint không được hardcode trong mã nguồn. Thiết lập tại đây hoặc qua file
          môi trường. URL API là cấu hình khởi động của máy FE; khóa ArcGIS được lưu trong DB.
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
          <FormField label="Khóa API bản đồ ArcGIS" htmlFor="arcgisApiKey">
            <TextField
              id="arcgisApiKey"
              name="arcgisApiKey"
              type="password"
              autoComplete="off"
              value={arcgisApiKey}
              placeholder={
                source.arcgisApiKey === 'none'
                  ? 'Chưa có khóa — nhập để dùng nền vệ tinh'
                  : 'Để trống nếu giữ khóa hiện tại'
              }
              onChange={(event) => {
                setArcgisApiKey(event.target.value)
                setSaved(false)
              }}
            />
          </FormField>
        </div>

        <p className={styles.hint}>
          URL API đang lấy từ {SOURCE_LABEL[source.apiBaseUrl]}. Khóa ArcGIS đang lấy từ{' '}
          {SOURCE_LABEL[source.arcgisApiKey]}.
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
        <Button type="submit" variant="success" disabled={loading}>
          {loading ? 'Đang xử lý...' : 'Lưu cấu hình'}
        </Button>
      </div>
    </form>
  )
}
