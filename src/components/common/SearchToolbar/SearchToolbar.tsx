import type { FormEvent, ReactNode } from 'react'
import { Button } from '@/components/common/Button'
import styles from './SearchToolbar.module.css'

type SearchToolbarProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onSearch?: () => void
  onRefresh?: () => void
  searchLabel?: string
  refreshLabel?: string
  actions?: ReactNode
}

export function SearchToolbar({
  value,
  onChange,
  placeholder = 'Nhập từ khóa tìm kiếm',
  onSearch,
  onRefresh,
  searchLabel = 'Tìm kiếm',
  refreshLabel = 'Làm mới',
  actions,
}: SearchToolbarProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSearch?.()
  }

  return (
    <form className={styles.toolbar} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />

      <div className={styles.actions}>
        <Button type="submit" variant="primary">
          {searchLabel}
        </Button>
        {onRefresh ? (
          <Button
            type="button"
            variant="secondary"
            className={styles.resetButton}
            onClick={onRefresh}
          >
            {refreshLabel}
          </Button>
        ) : null}
        {actions}
      </div>
    </form>
  )
}
