import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { SelectField } from '@/components/common/SelectField'
import { TextField } from '@/components/common/TextField'
import { firstError, validateDateRange, validateKeyword } from '@/validation'
import { EventDateField } from './EventDateField'
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
  exportDisabled?: boolean
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
  exportDisabled = false,
}: EventFilterBarProps) {
  const [error, setError] = useState('')

  const patch = (partial: Partial<EventFilterValues>) => {
    onChange({ ...values, ...partial })
  }

  const runIfValid = (action: () => void) => {
    const check = firstError(
      validateDateRange(values.fromDate, values.toDate),
      validateKeyword(values.keyword),
    )
    if (!check.ok) {
      setError(check.message)
      return
    }
    setError('')
    action()
  }

  return (
    <div className={styles.wrap}>
    <div className={styles.bar}>
      <SelectField
        className={styles.deviceSelect}
        options={deviceOptions}
        value={values.deviceId}
        onChange={(event) => patch({ deviceId: event.target.value })}
        aria-label="Thiết bị"
      />

      <EventDateField
        label="Từ"
        value={values.fromDate}
        ariaLabel="Từ ngày"
        onChange={(fromDate) => patch({ fromDate })}
      />

      <EventDateField
        label="đến"
        value={values.toDate}
        ariaLabel="Đến ngày"
        onChange={(toDate) => patch({ toDate })}
      />

      {showKeyword ? (
        <TextField
          className={styles.searchField}
          type="search"
          value={values.keyword}
          placeholder="Tìm kiếm từ khóa"
          maxLength={120}
          onChange={(event) => patch({ keyword: event.target.value })}
          aria-label="Tìm kiếm từ khóa"
        />
      ) : null}

      <div className={styles.actions}>
        <Button
          variant="primary"
          className={styles.filterButton}
          onClick={() => runIfValid(onFilter)}
        >
          Lọc
        </Button>
        <Button
          variant="secondary"
          className={styles.resetButton}
          onClick={() => {
            setError('')
            onReset()
          }}
        >
          {resetLabel}
        </Button>
        <Button variant="primary" onClick={() => runIfValid(onExport)} disabled={exportDisabled}>
          Xuất Excel
        </Button>
      </div>
    </div>
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  )
}
