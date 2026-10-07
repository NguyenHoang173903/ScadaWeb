import { Fragment } from 'react'
import styles from './TabularDigits.module.css'

type TabularDigitsProps = {
  value: string
  className?: string
}

/**
 * Renders text with every digit in a fixed 1ch box so ticking clocks keep a
 * constant width. Be Vietnam Pro / Poppins from Google Fonts ignore `tnum`,
 * so font-variant-numeric alone does not stop the layout from shifting.
 */
export function TabularDigits({ value, className }: TabularDigitsProps) {
  const parts: string[] = value.match(/\d|\D+/g) ?? []
  return (
    <span className={className ? `${styles.root} ${className}` : styles.root}>
      {parts.map((part, index) =>
        /^\d$/.test(part) ? (
          <span key={index} className={styles.digit}>
            {part}
          </span>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </span>
  )
}
