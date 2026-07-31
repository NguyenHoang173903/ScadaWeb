import { CalendarDays } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { SelectField } from '@/components/common/SelectField'
import { TextField } from '@/components/common/TextField'
import styles from './ChartFilterBar.module.css'

export type ChartFilterValues = {
  deviceId: string
  fromDate: string
  fromTime: string
  toDate: string
  toTime: string
}

type ChartFilterBarProps = {
  values: ChartFilterValues
  deviceOptions: { value: string; label: string }[]
  onChange: (next: ChartFilterValues) => void
  onFilter: () => void
  onReset: () => void
}

export function ChartFilterBar({
  values,
  deviceOptions,
  onChange,
  onFilter,
  onReset,
}: ChartFilterBarProps) {
  const patch = (partial: Partial<ChartFilterValues>) => {
    onChange({ ...values, ...partial })
  }

  return (
    <div className={styles.bar}>
      <SelectField
        className={styles.deviceSelect}
        options={deviceOptions}
        value={values.deviceId}
        onChange={(event) => patch({ deviceId: event.target.value })}
        aria-label="Chọn thiết bị"
      />

      <div className={styles.rangeGroup}>
        <span className={styles.rangeLabel}>Từ</span>
        <label className={styles.dateField}>
          <TextField
            type="date"
            value={values.fromDate}
            onChange={(event) => patch({ fromDate: event.target.value })}
            aria-label="Từ ngày"
          />
          <CalendarDays size={16} className={styles.dateIcon} aria-hidden />
        </label>
        <TextField
          className={styles.timeField}
          type="time"
          step={1}
          value={values.fromTime}
          onChange={(event) => patch({ fromTime: event.target.value })}
          aria-label="Từ giờ"
        />
      </div>

      <div className={styles.rangeGroup}>
        <span className={styles.rangeLabel}>đến</span>
        <label className={styles.dateField}>
          <TextField
            type="date"
            value={values.toDate}
            onChange={(event) => patch({ toDate: event.target.value })}
            aria-label="Đến ngày"
          />
          <CalendarDays size={16} className={styles.dateIcon} aria-hidden />
        </label>
        <TextField
          className={styles.timeField}
          type="time"
          step={1}
          value={values.toTime}
          onChange={(event) => patch({ toTime: event.target.value })}
          aria-label="Đến giờ"
        />
      </div>

      <div className={styles.actions}>
        <Button variant="primary" onClick={onFilter}>
          Lọc
        </Button>
        <Button variant="secondary" onClick={onReset}>
          Làm mới
        </Button>
      </div>
    </div>
  )
}
