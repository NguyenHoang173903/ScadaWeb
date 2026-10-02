import { Button } from '@/components/common/Button'
import { FormField } from '@/components/common/FormField'
import { SelectField } from '@/components/common/SelectField'
import { TextField } from '@/components/common/TextField'
import { Time24Field } from '@/components/common/Time24Field'
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
  exportDisabled?: boolean
}

export function ReportFilterBar({
  values,
  deviceOptions,
  onChange,
  onFilter,
  onReset,
  onExport,
  exportDisabled = false,
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
        <Time24Field
          id="report-start-time"
          value={values.startTime}
          onValueChange={(value) => patch({ startTime: value })}
        />
      </FormField>

      <FormField label="Giờ kết thúc" htmlFor="report-end-time">
        <Time24Field
          id="report-end-time"
          value={values.endTime}
          onValueChange={(value) => patch({ endTime: value })}
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
        <Button variant="secondary" className={styles.resetButton} onClick={onReset}>
          Làm mới
        </Button>
        <Button variant="primary" onClick={onExport} disabled={exportDisabled}>
          Xuất Excel
        </Button>
      </div>
    </div>
  )
}
