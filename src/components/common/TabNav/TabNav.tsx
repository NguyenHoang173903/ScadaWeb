import { useEffect, useState, type ReactNode } from 'react'
import { SelectField } from '@/components/common/SelectField'
import styles from './TabNav.module.css'

export type TabItem = {
  id: string
  label: string
}

type TabNavProps = {
  items: TabItem[]
  activeId: string
  onChange: (id: string) => void
  trailing?: ReactNode
  className?: string
}

function useNarrow() {
  const query = '(max-width: 1023px)'
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setNarrow(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return narrow
}

export function TabNav({ items, activeId, onChange, trailing, className }: TabNavProps) {
  const menu = useNarrow() && items.length > 1

  return (
    <div className={[styles.bar, className, menu ? styles.menuBar : ''].filter(Boolean).join(' ')}>
      {menu ? (
        <SelectField
          className={styles.field}
          aria-label="Điều hướng trang"
          options={items.map((item) => ({ value: item.id, label: item.label }))}
          value={activeId}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <nav className={styles.tabs} aria-label="Điều hướng trang">
          {items.map((item) => {
            const active = item.id === activeId
            return (
              <button
                key={item.id}
                type="button"
                className={`${styles.tab} ${active ? styles.active : ''}`}
                onClick={() => onChange(item.id)}
              >
                {item.label}
              </button>
            )
          })}
        </nav>
      )}
      {trailing ? <div className={styles.trailing}>{trailing}</div> : null}
    </div>
  )
}
