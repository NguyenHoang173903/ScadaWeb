import type { ReactNode } from 'react'
import styles from './Badge.module.css'

type BadgeTone = 'yellow' | 'blue' | 'green' | 'gray' | 'red' | 'teal'

type BadgeProps = {
  children: ReactNode
  tone?: BadgeTone
}

export function Badge({ children, tone = 'gray' }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>
}
