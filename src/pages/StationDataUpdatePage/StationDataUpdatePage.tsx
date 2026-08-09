import { useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, Upload } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { FormField } from '@/components/common/FormField'
import { TabNav } from '@/components/common/TabNav'
import { TextField } from '@/components/common/TextField'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { ROUTES } from '@/constants/routes'
import { getPumpStationById } from '@/data/pumpStations'
import styles from './StationDataUpdatePage.module.css'

type FormValues = {
  projectName: string
  managementUnit: string
  mission: string
  classification: string
  builtYear: string
  pumpEquipment: string
}

export function StationDataUpdatePage() {
  const navigate = useNavigate()
  const { stationId = '' } = useParams()
  const station = getPumpStationById(stationId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [values, setValues] = useState<FormValues>({
    projectName: station?.name ?? '',
    managementUnit: '',
    mission: '',
    classification: '',
    builtYear: '',
    pumpEquipment: '',
  })
  const [imageName, setImageName] = useState('')
  const [error, setError] = useState('')

  const title = useMemo(() => {
    const name = station?.name?.replace(/^Trạm\s+/i, '') ?? stationId
    return `CẬP NHẬT THÔNG TIN DỮ LIỆU CHO TRẠM BƠM ${name}`.toUpperCase()
  }, [station?.name, stationId])

  const updateField = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!values.projectName.trim() || !values.managementUnit.trim()) {
      setError('Vui lòng nhập đầy đủ các trường bắt buộc.')
      return
    }

    setError('')
    // Persist via API later; for now just return to dashboard.
    navigate(ROUTES.dashboard)
  }

  if (!station) {
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
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.panel}>
            <div className={styles.grid}>
              <div className={styles.column}>
                <FormField label="Tên công trình" htmlFor="projectName" required>
                  <TextField
                    id="projectName"
                    value={values.projectName}
                    onChange={(event) => updateField('projectName', event.target.value)}
                    placeholder="Trạm bơm dã chiến Ấp Bắc"
                  />
                </FormField>
                <FormField label="Đơn vị quản lý" htmlFor="managementUnit" required>
                  <TextField
                    id="managementUnit"
                    value={values.managementUnit}
                    onChange={(event) => updateField('managementUnit', event.target.value)}
                  />
                </FormField>
                <FormField label="Nhiệm vụ" htmlFor="mission">
                  <TextField
                    id="mission"
                    value={values.mission}
                    onChange={(event) => updateField('mission', event.target.value)}
                  />
                </FormField>
              </div>

              <div className={styles.column}>
                <FormField label="Phân loại" htmlFor="classification">
                  <TextField
                    id="classification"
                    value={values.classification}
                    onChange={(event) => updateField('classification', event.target.value)}
                  />
                </FormField>
                <FormField label="Năm xây dựng" htmlFor="builtYear">
                  <TextField
                    id="builtYear"
                    value={values.builtYear}
                    onChange={(event) => updateField('builtYear', event.target.value)}
                  />
                </FormField>
                <FormField label="Thiết bị bơm" htmlFor="pumpEquipment">
                  <TextField
                    id="pumpEquipment"
                    value={values.pumpEquipment}
                    onChange={(event) => updateField('pumpEquipment', event.target.value)}
                  />
                </FormField>
              </div>

              <div className={styles.column}>
                <FormField label="Ảnh khu vực trạm bơm" htmlFor="stationImage">
                  <input
                    ref={fileInputRef}
                    id="stationImage"
                    type="file"
                    accept="image/*"
                    className={styles.hiddenInput}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      setImageName(file?.name ?? '')
                    }}
                  />
                  <button
                    type="button"
                    className={styles.uploadButton}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={18} />
                    <span>Tải ảnh lên</span>
                  </button>
                  {imageName ? <p className={styles.imageName}>{imageName}</p> : null}
                </FormField>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            {error ? <p className={styles.error}>{error}</p> : <span />}
            <Button type="submit" variant="success">
              Xác nhận
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
