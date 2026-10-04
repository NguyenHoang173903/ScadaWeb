import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { TextField } from "@/components/common/TextField"
import styles from "./EventFilterBar.module.css"

type EventDateFieldProps = {
  label?: string
  value: string
  ariaLabel: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
  id?: string
  block?: boolean
}

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

function useNarrow() {
  const query = "(max-width: 900px)"
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  )
  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setNarrow(media.matches)
    onChange()
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])
  return narrow
}

function parseIso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

function toIso(date: Date) {
  const pad = (part: number) => String(part).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function displayDate(value: string) {
  const date = parseIso(value)
  if (!date) return ""
  const pad = (part: number) => String(part).padStart(2, "0")
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

function monthCells(cursor: Date) {
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const offset = (new Date(year, month, 1).getDay() + 6) % 7
  const count = new Date(year, month + 1, 0).getDate()
  const cells: Array<Date | null> = Array.from({ length: offset }, () => null)
  for (let day = 1; day <= count; day += 1) cells.push(new Date(year, month, day))
  return cells
}

export function EventDateField({
  label,
  value,
  ariaLabel,
  onChange,
  className,
  disabled = false,
  id,
  block = false,
}: EventDateFieldProps) {
  const narrow = useNarrow()
  const anchorRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(() => parseIso(value) ?? new Date())
  const [position, setPosition] = useState({ top: 8, left: 8, width: 280 })

  useEffect(() => {
    if (!open) return
    const selected = parseIso(value)
    if (selected) setCursor(selected)
  }, [open, value])

  useLayoutEffect(() => {
    if (!open) return
    const anchor = anchorRef.current
    const panel = panelRef.current
    if (!anchor || !panel) return

    const place = () => {
      const rect = anchor.getBoundingClientRect()
      const margin = 8
      const width = Math.min(280, window.innerWidth - margin * 2)
      let left = rect.left
      if (left + width > window.innerWidth - margin) {
        left = window.innerWidth - margin - width
      }
      left = Math.max(margin, left)
      const height = panel.offsetHeight
      let top = rect.bottom + 6
      if (top + height > window.innerHeight - margin) {
        top = rect.top - height - 6
      }
      top = Math.max(margin, Math.min(top, window.innerHeight - margin - height))
      setPosition({ top, left, width })
    }

    place()
    window.addEventListener("resize", place)
    return () => window.removeEventListener("resize", place)
  }, [open, cursor])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node
      if (anchorRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const desktop = (
    <TextField
      id={id}
      className={[label ? styles.dateField : "", className].filter(Boolean).join(" ")}
      type="date"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      aria-label={ariaLabel}
    />
  )

  if (!narrow) {
    if (!label) return desktop
    return (
      <div className={styles.rangeGroup}>
        <span className={styles.rangeLabel}>{label}</span>
        {desktop}
      </div>
    )
  }

  const cells = monthCells(cursor)
  const selected = parseIso(value)

  return (
    <div className={label ? styles.rangeGroup : block ? styles.bareAnchorFill : styles.bareAnchor} ref={anchorRef}>
      {label ? <span className={styles.rangeLabel}>{label}</span> : null}
      <button
        type="button"
        id={id}
        className={[label ? styles.dateField : "", styles.dateButton, className].filter(Boolean).join(" ")}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((current) => !current)
        }}
      >
        {displayDate(value) || "--/--/----"}
      </button>
      {open ? (
        <div
          ref={panelRef}
          className={styles.calendar}
          role="dialog"
          aria-label={ariaLabel}
          style={{ top: position.top, left: position.left, width: position.width }}
        >
          <div className={styles.calendarHead}>
            <button
              type="button"
              className={styles.calendarNav}
              onClick={() =>
                setCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
              }
            >
              {"<"}
            </button>
            <strong>
              {cursor.getMonth() + 1}/{cursor.getFullYear()}
            </strong>
            <button
              type="button"
              className={styles.calendarNav}
              onClick={() =>
                setCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
              }
            >
              {">"}
            </button>
          </div>
          <div className={styles.calendarWeek}>
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className={styles.calendarGrid}>
            {cells.map((date, index) =>
              date ? (
                <button
                  key={toIso(date)}
                  type="button"
                  className={
                    selected && toIso(date) === toIso(selected)
                      ? `${styles.calendarDay} ${styles.calendarDaySelected}`
                      : styles.calendarDay
                  }
                  onClick={() => {
                    onChange(toIso(date))
                    setOpen(false)
                  }}
                >
                  {date.getDate()}
                </button>
              ) : (
                <span key={`empty-${index}`} />
              ),
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
