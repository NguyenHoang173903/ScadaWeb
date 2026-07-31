import type { TextareaHTMLAttributes } from 'react'
import styles from './TextAreaField.module.css'

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export function TextAreaField({ className, ...props }: TextAreaFieldProps) {
  const classes = [styles.textarea, className].filter(Boolean).join(' ')
  return <textarea className={classes} {...props} />
}
