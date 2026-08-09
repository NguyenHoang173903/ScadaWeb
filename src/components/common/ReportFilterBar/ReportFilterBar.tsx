import { Button } from '@/components/common/Button'
import { FormField } from '@/components/common/FormField'
import { SelectField } from '@/components/common/SelectField'
import { TextField } from '@/components/common/TextField'
import styles from './ReportFilterBar.module.css'

export type ReportFilterValues = {
  reportDate: string
  startTime: string
  endTime: string
  deviceId: string
}

type ReportFilterBarProps = {
  values: ReportFilterValues
  deviceOptions: { value: string; label: string }[]
  onChange: (next: ReportFilterValues) => void
  onFilter: () => void
  onReset: () => void
  onExport: () => void
}

export function ReportFilterBar({
  values,
  deviceOptions,
  onChange,
  onFilter,
  onReset,
  onExport,
}: ReportFilterBarProps) {
  const patch = (partial: Partial<ReportFilterValues>) => {
    onChange({ ...values, ...partial })
  }

  return (
    <div className={styles.bar}>
      <FormField label="Ngày báo cáo" htmlFor="report-date">
        <TextField
          id="report-date"
          type="date"
          value={values.reportDate}
          onChange={(event) => patch({ reportDate: event.target.value })}
        />
      </FormField>

      <FormField label="Giờ bắt đầu" htmlFor="report-start-time">
        <TextField
          id="report-start-time"
          type="time"
          step={1}
          value={values.startTime}
          onChange={(event) => patch({ startTime: event.target.value })}
        />
      </FormField>

      <FormField label="Giờ kết thúc" htmlFor="report-end-time">
        <TextField
          id="report-end-time"
          type="time"
          step={1}
          value={values.endTime}
          onChange={(event) => patch({ endTime: event.target.value })}
        />
      </FormField>

      <FormField label="Thiết bị" htmlFor="report-device">
        <SelectField
          id="report-device"
          options={deviceOptions}
          value={values.deviceId}
          onChange={(event) => patch({ deviceId: event.target.value })}
        />
      </FormField>

      <div className={styles.actions}>
        <Button variant="primary" className={styles.filterButton} onClick={onFilter}>
          Lọc
        </Button>
        <Button variant="secondary" onClick={onReset}>
          Làm mới
        </Button>
        <Button variant="primary" onClick={onExport}>
          Xuất Excel
        </Button>
      </div>
    </div>
  )
}
