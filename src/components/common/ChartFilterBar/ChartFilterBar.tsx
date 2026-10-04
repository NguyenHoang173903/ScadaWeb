import { Button } from '@/components/common/Button'
import { SelectField } from '@/components/common/SelectField'
import { EventDateField } from '@/components/common/EventFilterBar/EventDateField'
import { Time24Field } from '@/components/common/Time24Field'
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

function oneHourAfter(fromDate: string, fromTime: string) {
  const from = new Date(`${fromDate}T${fromTime || '00:00:00'}`)
  if (Number.isNaN(from.getTime())) return null
  const end = new Date(from.getTime() + 60 * 60 * 1000)
  const pad = (value: number) => String(value).padStart(2, '0')
  return {
    date: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
    time: `${pad(end.getHours())}:${pad(end.getMinutes())}:${pad(end.getSeconds())}`,
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
  const patch = (partial: Partial<ChartFilterValues>) => {
    onChange({ ...values, ...partial })
  }

  const patchStart = (partial: Pick<Partial<ChartFilterValues>, 'fromDate' | 'fromTime'>) => {
    const next = { ...values, ...partial }
    const end = oneHourAfter(next.fromDate, next.fromTime)
    onChange({
      ...next,
      ...(end ? { toDate: end.date, toTime: end.time } : {}),
    })
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
        <EventDateField
          className={styles.dateField}
          value={values.fromDate}
          onChange={(fromDate) => patchStart({ fromDate })}
          ariaLabel="Từ ngày"
        />
        <Time24Field
          className={styles.timeField}
          value={values.fromTime}
          onValueChange={(value) => patchStart({ fromTime: value })}
          aria-label="Từ giờ"
        />
      </div>

      <div className={styles.rangeGroup}>
        <span className={styles.rangeLabel}>đến</span>
        <EventDateField
          className={`${styles.dateField} ${lockEndToNow ? styles.lockedField : ''}`}
          value={values.toDate}
          onChange={(toDate) => patch({ toDate })}
          ariaLabel="Đến ngày"
          disabled={lockEndToNow}
        />
        <Time24Field
          className={`${styles.timeField} ${lockEndToNow ? styles.lockedField : ''}`}
          value={values.toTime}
          onValueChange={(value) => patch({ toTime: value })}
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
