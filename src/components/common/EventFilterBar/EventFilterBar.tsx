import { Button } from '@/components/common/Button'
import { SelectField } from '@/components/common/SelectField'
import { TextField } from '@/components/common/TextField'
import styles from './EventFilterBar.module.css'

export type EventFilterValues = {
  deviceId: string
  fromDate: string
  toDate: string
  keyword: string
}

type EventFilterBarProps = {
  values: EventFilterValues
  deviceOptions: { value: string; label: string }[]
  onChange: (next: EventFilterValues) => void
  onFilter: () => void
  onReset: () => void
  onExport: () => void
  showKeyword?: boolean
  resetLabel?: string
}

export function EventFilterBar({
  values,
  deviceOptions,
  onChange,
  onFilter,
  onReset,
  onExport,
  showKeyword = true,
  resetLabel = 'Làm mới',
}: EventFilterBarProps) {
  const patch = (partial: Partial<EventFilterValues>) => {
    onChange({ ...values, ...partial })
  }

  return (
    <div className={styles.bar}>
      <SelectField
        className={styles.deviceSelect}
        options={deviceOptions}
        value={values.deviceId}
        onChange={(event) => patch({ deviceId: event.target.value })}
        aria-label="Thiết bị"
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
      </div>

      <div className={styles.rangeGroup}>
        <span className={styles.rangeLabel}>đến</span>
        <TextField
          className={styles.dateField}
          type="date"
          value={values.toDate}
          onChange={(event) => patch({ toDate: event.target.value })}
          aria-label="Đến ngày"
        />
      </div>

      {showKeyword ? (
        <TextField
          className={styles.searchField}
          type="search"
          value={values.keyword}
          placeholder="Tìm kiếm từ khóa"
          onChange={(event) => patch({ keyword: event.target.value })}
          aria-label="Tìm kiếm từ khóa"
        />
      ) : null}

      <div className={styles.actions}>
        <Button variant="primary" className={styles.filterButton} onClick={onFilter}>
          Lọc
        </Button>
        <Button variant="secondary" onClick={onReset}>
          {resetLabel}
        </Button>
        <Button variant="primary" onClick={onExport}>
          Xuất Excel
        </Button>
      </div>
    </div>
  )
}
