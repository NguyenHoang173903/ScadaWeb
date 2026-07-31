import type { ReactNode } from 'react'
import { APP_NAME } from '@/constants/config'
import styles from './MainLayout.module.css'

type MainLayoutProps = {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <strong>{APP_NAME}</strong>
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  )
}
