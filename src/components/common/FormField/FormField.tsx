import type { ReactNode } from 'react'
import styles from './FormField.module.css'

type FormFieldProps = {
  label: string
  htmlFor?: string
  required?: boolean
  children: ReactNode
}

export function FormField({
  label,
  htmlFor,
  required = false,
  children,
}: FormFieldProps) {
  return (
    <label className={styles.field} htmlFor={htmlFor}>
      <span className={styles.label}>
        {label}
        {required ? <span className={styles.required}> *</span> : null}
      </span>
      {children}
    </label>
  )
}
