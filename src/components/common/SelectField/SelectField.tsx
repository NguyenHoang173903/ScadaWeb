import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type SelectHTMLAttributes,
} from 'react'
import { ChevronDown } from 'lucide-react'
import styles from './SelectField.module.css'

export type SelectOption = {
  value: string
  label: string
}

type SelectFieldProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'children' | 'onChange' | 'size'
> & {
  options: SelectOption[]
  onChange?: (event: { target: { value: string; name?: string } }) => void
}

export function SelectField({
  options,
  className,
  value,
  defaultValue,
  onChange,
  disabled,
  id,
  name,
  'aria-label': ariaLabel,
}: SelectFieldProps) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [uncontrolled, setUncontrolled] = useState(
    String(defaultValue ?? options[0]?.value ?? ''),
  )

  const isControlled = value !== undefined
  const currentValue = String(isControlled ? value : uncontrolled)
  const selected =
    options.find((option) => option.value === currentValue) ?? options[0]

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const commit = (next: string) => {
    if (!isControlled) setUncontrolled(next)
    onChange?.({ target: { value: next, name } })
    setOpen(false)
  }

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setOpen(true)
    }
  }

  return (
    <div
      ref={rootRef}
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-open={open ? 'true' : undefined}
    >
      <button
        id={id}
        type="button"
        className={styles.trigger}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={onTriggerKeyDown}
      >
        <span className={styles.triggerLabel}>{selected?.label ?? ''}</span>
        <ChevronDown size={18} className={styles.chevron} aria-hidden />
      </button>

      {open ? (
        <div className={styles.menu} role="presentation">
          <div className={styles.menuHead} aria-hidden />
          <ul id={listId} className={styles.list} role="listbox" aria-label={ariaLabel}>
            {options.map((option) => {
              const active = option.value === currentValue
              return (
                <li key={option.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={styles.option}
                    data-active={active ? 'true' : undefined}
                    onClick={() => commit(option.value)}
                  >
                    {option.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
