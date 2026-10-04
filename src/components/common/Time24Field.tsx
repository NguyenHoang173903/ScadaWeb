import { useEffect, useLayoutEffect, useRef, useState, type InputHTMLAttributes } from 'react'
import { ChevronDown, Clock3 } from 'lucide-react'
import { TextField } from '@/components/common/TextField'
import styles from './Time24Field.module.css'

type Time24FieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'inputMode' | 'maxLength'
> & {
  value: string
  onValueChange: (value: string) => void
}

type TimePart = 'hours' | 'minutes' | 'seconds'

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, '0'),
)
const MINUTE_SECOND_OPTIONS = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, '0'),
)

function TimePartPicker({
  label,
  value,
  options,
  open,
  onToggle,
  onSelect,
}: {
  label: string
  value: string
  options: string[]
  open: boolean
  onToggle: () => void
  onSelect: (value: string) => void
}) {
  return (
    <label>
      <span>{label}</span>
      <span className={styles.partPicker}>
        <button
          type="button"
          className={styles.partButton}
          aria-expanded={open}
          onClick={onToggle}
        >
          {value}
          <ChevronDown size={14} />
        </button>
        {open ? (
          <span className={styles.partMenu} role="listbox">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                className={option === value ? styles.partOptionActive : styles.partOption}
                role="option"
                aria-selected={option === value}
                onClick={() => onSelect(option)}
              >
                {option}
              </button>
            ))}
          </span>
        ) : null}
      </span>
    </label>
  )
}

function formatTime24Input(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 6)
  const hours = digits.slice(0, 2)
  const minutes = digits.slice(2, 4)
  const seconds = digits.slice(4, 6)

  if (hours.length === 2 && Number(hours) > 23) return null
  if (minutes.length === 2 && Number(minutes) > 59) return null
  if (seconds.length === 2 && Number(seconds) > 59) return null

  return [hours, minutes, seconds].filter(Boolean).join(':')
}

export function Time24Field({
  value,
  onValueChange,
  className,
  disabled,
  ...props
}: Time24FieldProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const panelRef = useRef<HTMLSpanElement>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [openPart, setOpenPart] = useState<TimePart | null>(null)
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches,
  )
  const [panelBox, setPanelBox] = useState<{ top: number; left: number; width: number } | null>(null)
  const [hours = '00', minutes = '00', seconds = '00'] = value.split(':')

  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)')
    const onChange = () => setNarrow(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useLayoutEffect(() => {
    if (!narrow || !pickerOpen) return
    const anchor = wrapperRef.current
    const panel = panelRef.current
    if (!anchor || !panel) return

    const place = () => {
      const rect = anchor.getBoundingClientRect()
      const margin = 8
      const width = Math.min(panel.scrollWidth, window.innerWidth - margin * 2)
      let left = rect.left
      if (left + width > window.innerWidth - margin) left = window.innerWidth - margin - width
      left = Math.max(margin, left)
      const height = panel.offsetHeight
      let top = rect.bottom + 6
      if (top + height > window.innerHeight - margin) top = rect.top - height - 6
      top = Math.max(margin, Math.min(top, window.innerHeight - margin - height))
      setPanelBox({ top, left, width })
    }

    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [narrow, pickerOpen, openPart])

  useEffect(() => {
    const closePicker = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setPickerOpen(false)
        setOpenPart(null)
      }
    }
    document.addEventListener('mousedown', closePicker)
    return () => document.removeEventListener('mousedown', closePicker)
  }, [])

  const updatePart = (part: 'hours' | 'minutes' | 'seconds', next: string) => {
    onValueChange(
      [
        part === 'hours' ? next : hours.padStart(2, '0'),
        part === 'minutes' ? next : minutes.padStart(2, '0'),
        part === 'seconds' ? next : seconds.padStart(2, '0'),
      ].join(':'),
    )
  }

  return (
    <span ref={wrapperRef} className={styles.wrapper}>
      <TextField
        {...props}
        className={`${styles.visibleInput} ${className ?? ''}`}
        type="text"
        inputMode="numeric"
        maxLength={8}
        placeholder="HH:mm:ss"
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const next = formatTime24Input(event.target.value)
          if (next != null) onValueChange(next)
        }}
      />
      <button
        type="button"
        className={styles.pickerButton}
        aria-label="Chọn giờ"
        aria-expanded={pickerOpen}
        disabled={disabled}
        onClick={() => setPickerOpen((open) => !open)}
      >
        <Clock3 size={17} />
      </button>
      {pickerOpen && !disabled ? (
        <span
          ref={panelRef}
          className={styles.pickerPanel}
          style={
            narrow && panelBox
              ? { position: 'fixed', top: panelBox.top, left: panelBox.left, width: panelBox.width, right: 'auto' }
              : undefined
          }
        >
          <TimePartPicker
            label="Giờ"
            value={hours.padStart(2, '0')}
            options={HOUR_OPTIONS}
            open={openPart === 'hours'}
            onToggle={() => setOpenPart((part) => part === 'hours' ? null : 'hours')}
            onSelect={(next) => {
              updatePart('hours', next)
              setOpenPart(null)
            }}
          />
          <TimePartPicker
            label="Phút"
            value={minutes.padStart(2, '0')}
            options={MINUTE_SECOND_OPTIONS}
            open={openPart === 'minutes'}
            onToggle={() => setOpenPart((part) => part === 'minutes' ? null : 'minutes')}
            onSelect={(next) => {
              updatePart('minutes', next)
              setOpenPart(null)
            }}
          />
          <TimePartPicker
            label="Giây"
            value={seconds.padStart(2, '0')}
            options={MINUTE_SECOND_OPTIONS}
            open={openPart === 'seconds'}
            onToggle={() => setOpenPart((part) => part === 'seconds' ? null : 'seconds')}
            onSelect={(next) => {
              updatePart('seconds', next)
              setOpenPart(null)
            }}
          />
        </span>
      ) : null}
    </span>
  )
}
