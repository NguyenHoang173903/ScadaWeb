import type { ReactNode } from 'react'
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
}

export function TabNav({ items, activeId, onChange, trailing }: TabNavProps) {
  return (
    <div className={styles.bar}>
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
      {trailing ? <div className={styles.trailing}>{trailing}</div> : null}
    </div>
  )
}
