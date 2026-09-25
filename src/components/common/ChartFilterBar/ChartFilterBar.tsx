import { useEffect, useState } from 'react'
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
  lockEndToNow?: boolean
}

function currentEnd() {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
  }
}

export function ChartFilterBar({
  values,
  deviceOptions,
  onChange,
  onFilter,
  onReset,
  lockEndToNow = false,
}: ChartFilterBarProps) {
  const [lockedEnd, setLockedEnd] = useState(currentEnd)

  useEffect(() => {
    if (!lockEndToNow) return
    setLockedEnd(currentEnd())
    const timer = window.setInterval(() => setLockedEnd(currentEnd()), 1000)
    return () => window.clearInterval(timer)
  }, [lockEndToNow])

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
        <TextField
          className={styles.dateField}
          type="date"
          value={values.fromDate}
          onChange={(event) => patch({ fromDate: event.target.value })}
          aria-label="Từ ngày"
        />
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
        <TextField
          className={`${styles.dateField} ${lockEndToNow ? styles.lockedField : ''}`}
          type="date"
          value={lockEndToNow ? lockedEnd.date : values.toDate}
          onChange={(event) => patch({ toDate: event.target.value })}
          aria-label="Đến ngày"
          disabled={lockEndToNow}
        />
        <TextField
          className={`${styles.timeField} ${lockEndToNow ? styles.lockedField : ''}`}
          type="time"
          step={1}
          value={lockEndToNow ? lockedEnd.time : values.toTime}
          onChange={(event) => patch({ toTime: event.target.value })}
          aria-label="Đến giờ"
          disabled={lockEndToNow}
        />
      </div>

      <div className={styles.actions}>
        <Button variant="primary" onClick={onFilter}>
          Lọc
        </Button>
        <Button variant="secondary" className={styles.resetButton} onClick={onReset}>
          Làm mới
        </Button>
      </div>
    </div>
  )
}
