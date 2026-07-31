import type { InputHTMLAttributes } from 'react'
import styles from './TextField.module.css'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement>

export function TextField({ className, ...props }: TextFieldProps) {
  const classes = [styles.input, className].filter(Boolean).join(' ')
  return <input className={classes} {...props} />
}
