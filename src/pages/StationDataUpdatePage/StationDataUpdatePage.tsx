import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { FormField } from '@/components/common/FormField'
import { TabNav } from '@/components/common/TabNav'
import { TextAreaField } from '@/components/common/TextAreaField'
import { TextField } from '@/components/common/TextField'
import { ToggleSwitch } from '@/components/common/ToggleSwitch'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { ROUTES } from '@/constants/routes'
import { getPumpStationById, registerPumpStation } from '@/data/pumpStations'
import { isApiError } from '@/services/api/http'
import { getStation, updateStation } from '@/services/stations/stationsApi'
import { firstError, validateRequired } from '@/validation'
import { isSessionAdmin } from '@/settings/session'
import styles from './StationDataUpdatePage.module.css'

type FormValues = {
  name: string
  address: string
  latitude: string
  longitude: string
  description: string
  isActive: boolean
}

export function StationDataUpdatePage() {
  const navigate = useNavigate()
  const { stationId = '' } = useParams()
  const numericStation = /^\d+$/.test(stationId)
  const localStation = getPumpStationById(stationId)

  const [values, setValues] = useState<FormValues>({
    name: localStation?.name ?? '',
    address: localStation?.address ?? '',
    latitude: localStation?.lat != null ? String(localStation.lat) : '',
    longitude: localStation?.lng != null ? String(localStation.lng) : '',
    description: '',
    isActive: localStation?.status !== 'Ngưng hoạt động',
  })
  const [stationCode, setStationCode] = useState(localStation?.code ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(numericStation)
  const [saving, setSaving] = useState(false)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!numericStation || loadedRef.current) return
    loadedRef.current = true
    setLoading(true)
    void (async () => {
      try {
        const dto = await getStation(Number(stationId))
        setStationCode(dto.code)
        setValues({
          name: dto.name ?? '',
          address: dto.address ?? '',
          latitude: dto.latitude != null ? String(dto.latitude) : '',
          longitude: dto.longitude != null ? String(dto.longitude) : '',
          description: dto.description ?? '',
          isActive: dto.isActive,
        })
        registerPumpStation({
          id: String(dto.id),
          name: dto.name,
          code: dto.code,
          address: dto.address ?? '',
          status: dto.isActive ? 'Đang hoạt động' : 'Ngưng hoạt động',
          pumps: localStation?.pumps ?? 0,
          capacity: localStation?.capacity ?? '—',
          lat: dto.latitude ?? localStation?.lat ?? 0,
          lng: dto.longitude ?? localStation?.lng ?? 0,
        })
        setError('')
      } catch (err) {
        if (!localStation) {
          setError(isApiError(err) ? err.message : 'Không tải được thông tin trạm.')
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [stationId, numericStation, localStation])

  const title = useMemo(() => {
    const name = values.name?.replace(/^Trạm\s+/i, '') || stationId
    return `CẬP NHẬT THÔNG TIN DỮ LIỆU CHO TRẠM BƠM ${name}`.toUpperCase()
  }, [values.name, stationId])

  const updateField = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isSessionAdmin()) {
      setError('Chỉ Admin được cập nhật thông tin trạm.')
      return
    }
    if (!numericStation) {
      setError('Chỉ cập nhật được trạm có ID số từ backend.')
      return
    }

    const lat = values.latitude.trim() ? Number(values.latitude) : null
    const lng = values.longitude.trim() ? Number(values.longitude) : null
    const check = firstError(
      validateRequired(values.name, 'tên công trình'),
      values.latitude.trim() && !Number.isFinite(lat)
        ? { ok: false, message: 'Vĩ độ không hợp lệ.' }
        : { ok: true },
      values.longitude.trim() && !Number.isFinite(lng)
        ? { ok: false, message: 'Kinh độ không hợp lệ.' }
        : { ok: true },
    )
    if (!check.ok) {
      setError(check.message)
      return
    }

    setSaving(true)
    setError('')
    void (async () => {
      try {
        const updated = await updateStation(Number(stationId), {
          name: values.name.trim(),
          address: values.address.trim() || undefined,
          latitude: lat,
          longitude: lng,
          description: values.description.trim() || undefined,
          isActive: values.isActive,
        })
        registerPumpStation({
          id: String(updated.id),
          name: updated.name,
          code: updated.code,
          address: updated.address ?? '',
          status: updated.isActive ? 'Đang hoạt động' : 'Ngưng hoạt động',
          pumps: localStation?.pumps ?? 0,
          capacity: localStation?.capacity ?? '—',
          lat: updated.latitude ?? 0,
          lng: updated.longitude ?? 0,
        })
        navigate(ROUTES.dashboard)
      } catch (err) {
        setError(isApiError(err) ? err.message : 'Không cập nhật được trạm.')
      } finally {
        setSaving(false)
      }
    })()
  }

  if (!localStation && !numericStation) {
    return (
      <div className={styles.page}>
        <AdminHeader />
        <main className={styles.main}>
          <p className={styles.notFound}>Không tìm thấy trạm bơm.</p>
          <Button variant="primary" onClick={() => navigate(ROUTES.dashboard)}>
            Về Dashboard
          </Button>
        </main>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <AdminHeader />
      <TabNav
        items={[{ id: 'update', label: title }]}
        activeId="update"
        onChange={() => undefined}
        trailing={
          <button
            type="button"
            className={styles.backButton}
            aria-label="Quay lại Dashboard"
            onClick={() => navigate(ROUTES.dashboard)}
          >
            <ChevronRight size={18} />
          </button>
        }
      />

      <main className={styles.main}>
        {loading ? <p>Đang tải thông tin trạm...</p> : null}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.panel}>
            <div className={styles.grid}>
              <div className={styles.column}>
                <FormField label="Mã trạm" htmlFor="stationCode">
                  <TextField id="stationCode" value={stationCode} disabled />
                </FormField>
                <FormField label="Tên công trình" htmlFor="projectName" required>
                  <TextField
                    id="projectName"
                    value={values.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    placeholder="Trạm Bơm Ấp Bắc"
                  />
                </FormField>
                <FormField label="Địa chỉ" htmlFor="address">
                  <TextField
                    id="address"
                    value={values.address}
                    onChange={(event) => updateField('address', event.target.value)}
                  />
                </FormField>
              </div>

              <div className={styles.column}>
                <FormField label="Vĩ độ (latitude)" htmlFor="latitude">
                  <TextField
                    id="latitude"
                    value={values.latitude}
                    onChange={(event) => updateField('latitude', event.target.value)}
                  />
                </FormField>
                <FormField label="Kinh độ (longitude)" htmlFor="longitude">
                  <TextField
                    id="longitude"
                    value={values.longitude}
                    onChange={(event) => updateField('longitude', event.target.value)}
                  />
                </FormField>
                <div className={styles.statusRow}>
                  <span className={styles.statusLabel}>Trạm đang hoạt động</span>
                  <ToggleSwitch
                    id="isActive"
                    aria-label="Trạm đang hoạt động"
                    checked={values.isActive}
                    onChange={(checked) => updateField('isActive', checked)}
                  />
                </div>
              </div>

              <div className={styles.column}>
                <FormField label="Mô tả" htmlFor="description">
                  <TextAreaField
                    id="description"
                    rows={6}
                    value={values.description}
                    onChange={(event) => updateField('description', event.target.value)}
                    placeholder="Đơn vị quản lý, nhiệm vụ, phân loại, năm xây dựng…"
                  />
                </FormField>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            {error ? <p className={styles.error}>{error}</p> : <span />}
            <Button
              type="submit"
              variant="success"
              disabled={saving || loading || !numericStation || !isSessionAdmin()}
            >
              {saving ? 'Đang lưu...' : 'Xác nhận'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
