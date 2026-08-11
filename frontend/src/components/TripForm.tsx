import { useEffect, useState, type FormEvent } from 'react'
import { getErrorMessage } from '../services/api'
import {
  CURRENCIES,
  currencySymbol,
  TRAVEL_INTERESTS,
  TRAVEL_STYLES,
  type Trip,
  type TripInput,
} from '../services/tripService'
import DatePicker from './common/DatePicker'
import { Check, ChevronDown, Minus, Plus, Sparkles } from 'lucide-react'

interface TripFormProps {
  /** When provided, the form is pre-filled (edit mode). */
  initial?: Trip | null
  submitLabel: string
  onSubmit: (input: TripInput) => Promise<void>
  /** When provided, a primary "Generate My Trip" button is shown alongside the submit button. */
  onGenerate?: (input: TripInput) => Promise<void>
  /** True while an AI generation is in flight (disables all buttons). */
  generating?: boolean
  /** Live draft mirror for parent previews — fired whenever a field changes. */
  onDraftChange?: (draft: {
    destination: string
    startDate: string
    endDate: string
    travelers: string
    budget: string
    currency: string
    travelStyle: string
    interests: string[]
  }) => void
}

/** Field label — 13px, muted, letterspaced, sits 8px above the input. */
const labelClass = 'block text-[13px] font-medium tracking-[0.02em] text-muted'

export default function TripForm({
  initial,
  submitLabel,
  onSubmit,
  onGenerate,
  generating,
  onDraftChange,
}: TripFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [destination, setDestination] = useState(initial?.destination ?? '')
  const [startDate, setStartDate] = useState(initial?.startDate ?? '')
  const [endDate, setEndDate] = useState(initial?.endDate ?? '')
  const [travelers, setTravelers] = useState(initial?.travelers?.toString() ?? '1')
  const [budget, setBudget] = useState(initial?.budget?.toString() ?? '')
  const [currency, setCurrency] = useState(initial?.currency ?? 'USD')
  const [travelStyle, setTravelStyle] = useState(initial?.travelStyle ?? TRAVEL_STYLES[0])
  const [interests, setInterests] = useState<string[]>(initial?.interests ?? [])

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Report the live draft to any parent preview (Create Trip page) — this is
  // read-only for the parent; all state stays here in the form.
  useEffect(() => {
    onDraftChange?.({ destination, startDate, endDate, travelers, budget, currency, travelStyle, interests })
  }, [destination, startDate, endDate, travelers, budget, currency, travelStyle, interests]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleInterest = (interest: string) => {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((i) => i !== interest)
        : [...current, interest],
    )
  }

  const adjustTravelers = (delta: number) => {
    setTravelers((current) => {
      const next = Math.max(1, (Number(current) || 1) + delta)
      return String(next)
    })
  }

  const buildInput = (): TripInput | null => {
    if (!destination.trim()) {
      setError('Destination is required')
      return null
    }
    if (!startDate || !endDate) {
      setError('Start and end dates are required')
      return null
    }
    if (startDate > endDate) {
      setError('End date must be on or after the start date')
      return null
    }
    const travelersNum = Number(travelers)
    const budgetNum = Number(budget)
    if (!Number.isFinite(travelersNum) || travelersNum < 1) {
      setError('Travelers must be at least 1')
      return null
    }
    if (!Number.isFinite(budgetNum) || budgetNum <= 0) {
      setError('Budget must be greater than zero')
      return null
    }
    setError(null)
    return {
      title: title.trim() || `Trip to ${destination.trim()}`,
      destination: destination.trim(),
      startDate,
      endDate,
      travelers: travelersNum,
      budget: budgetNum,
      currency,
      travelStyle,
      interests,
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const input = buildInput()
    if (!input) return
    setSubmitting(true)
    try {
      await onSubmit(input)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save the trip. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleGenerate = async () => {
    const input = buildInput()
    if (!input || !onGenerate) return
    try {
      await onGenerate(input)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not generate the trip. Please try again.'))
    }
  }

  const disabled = submitting || generating

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-error/25 bg-error/10 px-4 py-3 text-sm text-error"
        >
          {error}
        </div>
      )}

      {/* ---- Destination ---- */}
      <section>
        <label className={labelClass} htmlFor="title">
          Title <span className="font-normal text-muted/70">(optional)</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input mt-2"
          placeholder="Summer in Japan"
        />

        <label className={labelClass} htmlFor="destination">
          Destination
        </label>
        <input
          id="destination"
          type="text"
          required
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="input mt-2"
          placeholder="Tokyo"
        />
      </section>

      <div aria-hidden="true" className="divider mt-8" />

      {/* ---- Dates ---- */}
      <section className="mt-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <DatePicker
            id="startDate"
            label="Start date"
            value={startDate}
            onChange={setStartDate}
          />
          <DatePicker
            id="endDate"
            label="End date"
            value={endDate}
            onChange={setEndDate}
            minDate={startDate || undefined}
          />
        </div>
      </section>

      <div aria-hidden="true" className="divider mt-8" />

      {/* ---- Travelers / Budget / Currency / Style ---- */}
      <section className="mt-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div role="group" aria-labelledby="travelers-label">
            <span id="travelers-label" className={labelClass}>
              Travelers
            </span>
            <div className="mt-2 flex items-center overflow-hidden rounded-[10px] border border-border bg-surface-hover transition-colors duration-200 focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgb(var(--color-primary)_/_0.15)]">
              <button
                type="button"
                onClick={() => adjustTravelers(-1)}
                disabled={disabled}
                aria-label="Decrease travelers"
                className="flex h-12 w-11 shrink-0 items-center justify-center text-muted transition-colors duration-200 hover:bg-surface-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/50 disabled:opacity-40"
              >
                <Minus size={15} aria-hidden="true" />
              </button>
              <span
                aria-live="polite"
                className="flex-1 text-center text-sm font-semibold text-text"
              >
                {travelers || '1'}
              </span>
              <button
                type="button"
                onClick={() => adjustTravelers(1)}
                disabled={disabled}
                aria-label="Increase travelers"
                className="flex h-12 w-11 shrink-0 items-center justify-center text-muted transition-colors duration-200 hover:bg-surface-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/50 disabled:opacity-40"
              >
                <Plus size={15} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="budget">
              Budget
            </label>
            <div className="relative mt-2">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-muted"
              >
                {currencySymbol(currency)}
              </span>
              <input
                id="budget"
                type="number"
                min={0.01}
                step={0.01}
                required
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="input pl-9"
                placeholder="3500.00"
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="currency">
              Currency
            </label>
            <div className="relative mt-2">
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="input pr-10"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="travelStyle">
              Travel style
            </label>
            <div className="relative mt-2">
              <select
                id="travelStyle"
                value={travelStyle}
                onChange={(e) => setTravelStyle(e.target.value)}
                className="input pr-10"
              >
                {TRAVEL_STYLES.map((style) => (
                  <option key={style} value={style}>
                    {style.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
            </div>
          </div>
        </div>
      </section>

      <div aria-hidden="true" className="divider mt-8" />

      {/* ---- Interests ---- */}
      <fieldset className="mt-8">
        <legend className={labelClass}>
          Interests <span className="font-normal text-muted/70">(multi-select)</span>
        </legend>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {TRAVEL_INTERESTS.map((interest) => {
            const selected = interests.includes(interest)
            return (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                aria-pressed={selected}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                  selected
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border bg-transparent text-muted hover:border-primary/40 hover:bg-surface-hover/60 hover:text-text'
                }`}
              >
                {selected && <Check size={13} aria-hidden="true" strokeWidth={2.5} />}
                {interest}
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* ---- Actions ---- */}
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        {onGenerate && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={disabled}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl btn-primary-bg py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200  hover:shadow-primary/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <Sparkles size={16} aria-hidden="true" />
            {generating ? 'Generating…' : 'Generate my trip'}
          </button>
        )}
        <button
          type="submit"
          disabled={disabled}
          className={`inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-50 ${
            onGenerate
              ? 'flex-1 border border-border bg-transparent text-muted hover:border-primary/40 hover:text-primary'
              : 'w-full btn-primary-bg text-white shadow-lg shadow-primary/25  hover:shadow-primary/40'
          }`}
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
