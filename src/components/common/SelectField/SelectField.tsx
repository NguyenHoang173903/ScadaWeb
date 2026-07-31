import type { SelectHTMLAttributes } from 'react'
import styles from './SelectField.module.css'

type SelectOption = {
  value: string
  label: string
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  options: SelectOption[]
}

export function SelectField({
  options,
  className,
  ...props
}: SelectFieldProps) {
  const classes = [styles.select, className].filter(Boolean).join(' ')

  return (
    <select className={classes} {...props}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
