import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { cn } from '../../utils/cn'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

export const DATE_PICKER_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface DatePickerProps {
  /** ISO date string (YYYY-MM-DD), empty when nothing selected. */
  value: string
  onChange: (value: string) => void
  /** Optional minimum selectable date (ISO) — earlier days are disabled. */
  minDate?: string
  label?: string
  placeholder?: string
  id?: string
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function parseIso(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  if (month < 0 || month > 11 || day < 1 || day > 31) return null
  return { year, month, day }
}

/** Friendly display: "12 Mar 2026" — falls back to the raw value. */
export function formatDisplayDate(value: string): string {
  const parsed = parseIso(value)
  if (!parsed) return value
  const date = new Date(parsed.year, parsed.month, parsed.day)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Calendar cells for a month, Monday-first, with leading blanks. */
function monthCells(year: number, month: number): (number | null)[] {
  const startDay = (new Date(year, month, 1).getDay() + 6) % 7 // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

/**
 * Custom calendar dropdown — replaces the native browser date input so the
 * picker matches the surface/border/primary design system. Opens on click,
 * closes on outside click or Escape, and exposes a normal ISO value upward.
 */
export default function DatePicker({
  value,
  onChange,
  minDate,
  label,
  placeholder = 'Select a date',
  id,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Fall back to a generated id so the label↔trigger association (and the
  // accessible name) works even when the caller doesn't pass an explicit id.
  const autoId = useId()
  const controlId = id ?? autoId
  const labelId = `${controlId}-label`

  const today = new Date()
  const selected = parseIso(value)

  const [viewYear, setViewYear] = useState(selected?.year ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(selected?.month ?? today.getMonth())

  // Keep the calendar on the selected month whenever the value changes.
  useEffect(() => {
    if (selected) {
      setViewYear(selected.year)
      setViewMonth(selected.month)
    }
  }, [value, selected?.year, selected?.month])

  // Close on outside click or Escape; move focus into the calendar on open.
  useEffect(() => {
    if (!open) return
    dialogRef.current?.focus()
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const cells = useMemo(() => monthCells(viewYear, viewMonth), [viewYear, viewMonth])

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  const isDisabled = (year: number, month: number, day: number) => {
    if (!minDate) return false
    return toIso(year, month, day) < minDate
  }

  const pickDay = (year: number, month: number, day: number) => {
    onChange(toIso(year, month, day))
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      {label && (
        <label
          htmlFor={controlId}
          id={labelId}
          className="block text-[13px] font-medium tracking-[0.02em] text-muted"
        >
          {label}
        </label>
      )}
      <button
        id={controlId}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={labelId}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'input mt-2 flex items-center justify-between gap-2 text-left',
          value ? 'text-text' : 'text-muted/65',
        )}
      >
        <span className="truncate">
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <CalendarDays
          size={17}
          aria-hidden="true"
          className={cn('shrink-0 transition-colors duration-200', open ? 'text-primary' : 'text-muted')}
        />
      </button>

      {open && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-label="Choose a date"
          tabIndex={-1}
          className="absolute z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] origin-top animate-modal-in rounded-2xl border border-border bg-surface p-4 shadow-2xl shadow-black/25 dark:shadow-black/50 focus:outline-none"
        >
          {/* Month header */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
              className="rounded-lg p-1.5 text-muted transition-colors duration-200 hover:bg-surface-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <ChevronLeft size={17} aria-hidden="true" />
            </button>
            <p className="text-sm font-semibold text-text">
              {DATE_PICKER_MONTHS[viewMonth]}{' '}
              <span className="font-normal text-muted">{viewYear}</span>
            </p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
              className="rounded-lg p-1.5 text-muted transition-colors duration-200 hover:bg-surface-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          </div>

          {/* Weekday header */}
          <div className="mt-3 grid grid-cols-7 text-center">
            {WEEKDAYS.map((day) => (
              <span
                key={day}
                className="py-1 text-[11px] font-semibold uppercase tracking-wider text-muted/70"
              >
                {day}
              </span>
            ))}
          </div>

          {/* Day grid */}
          <div className="mt-1 grid grid-cols-7 gap-0.5">
            {cells.map((day, index) => {
              if (day == null) return <span key={`blank-${index}`} aria-hidden="true" />
              const iso = toIso(viewYear, viewMonth, day)
              const disabled = isDisabled(viewYear, viewMonth, day)
              const isSelected = value === iso
              const isToday =
                day === today.getDate() &&
                viewMonth === today.getMonth() &&
                viewYear === today.getFullYear()
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => pickDay(viewYear, viewMonth, day)}
                  aria-label={`${day} ${DATE_PICKER_MONTHS[viewMonth]} ${viewYear}`}
                  aria-pressed={isSelected}
                  className={cn(
                    'flex h-9 w-full items-center justify-center rounded-lg text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-30',
                    isSelected
                      ? 'bg-primary font-semibold text-white shadow-glow-sm'
                      : 'text-text hover:bg-surface-hover hover:text-text',
                    isToday && !isSelected && 'border border-primary/40 text-primary',
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
