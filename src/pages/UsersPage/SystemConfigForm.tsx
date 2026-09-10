import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/common/Button'
import { FormField } from '@/components/common/FormField'
import { TextField } from '@/components/common/TextField'
import {
  getRuntimeConfig,
  getRuntimeConfigSource,
  setRuntimeConfig,
} from '@/settings/runtimeConfig'
import { firstError, validateHttpUrl, validateSecretKey } from '@/validation'
import styles from './PasswordPolicyForm.module.css'

const SOURCE_LABEL = {
  ui: 'giao diện cấu hình hệ thống',
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

  useEffect(() => {
    setApiBaseUrl(getRuntimeConfig().apiBaseUrl)
    setSource(getRuntimeConfigSource())
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const keyToSave = arcgisApiKey.trim()
    const check = firstError(
      validateHttpUrl(apiBaseUrl, 'URL API'),
      keyToSave
        ? validateSecretKey(keyToSave, 'Khóa ArcGIS', 16)
        : { ok: true },
    )
    if (!check.ok) {
      setError(check.message)
      setSaved(false)
      return
    }

    setRuntimeConfig({
      apiBaseUrl,
      ...(keyToSave ? { arcgisApiKey: keyToSave } : {}),
    })
    setArcgisApiKey('')
    setSource(getRuntimeConfigSource())
    setApiBaseUrl(getRuntimeConfig().apiBaseUrl)
    setError('')
    setSaved(true)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.panel}>
        <h3 className={styles.heading}>Thông tin xác thực và kết nối</h3>
        <p className={styles.hint}>
          Bí mật và endpoint không được hardcode trong mã nguồn. Thiết lập tại đây hoặc qua file
          môi trường. Tài khoản demo (OP, admin) vẫn giữ mật khẩu tạm trên máy để test khi chưa có
          backend.
        </p>

        <div className={styles.grid}>
          <FormField label="URL API backend" htmlFor="apiBaseUrl" required>
            <TextField
              id="apiBaseUrl"
              name="apiBaseUrl"
              value={apiBaseUrl}
              autoComplete="off"
              onChange={(event) => {
                setApiBaseUrl(event.target.value)
                setSaved(false)
              }}
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
        <Button type="submit" variant="success">
          Lưu cấu hình
        </Button>
      </div>
    </form>
  )
}
