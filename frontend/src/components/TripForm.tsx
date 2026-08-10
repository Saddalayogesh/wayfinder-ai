import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '../services/api'
import {
  TRAVEL_INTERESTS,
  TRAVEL_STYLES,
  type Trip,
  type TripInput,
} from '../services/tripService'

interface TripFormProps {
  /** When provided, the form is pre-filled (edit mode). */
  initial?: Trip | null
  submitLabel: string
  onSubmit: (input: TripInput) => Promise<void>
}

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'

const labelClass = 'mt-4 block text-sm font-medium text-slate-700'

export default function TripForm({ initial, submitLabel, onSubmit }: TripFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [destination, setDestination] = useState(initial?.destination ?? '')
  const [startDate, setStartDate] = useState(initial?.startDate ?? '')
  const [endDate, setEndDate] = useState(initial?.endDate ?? '')
  const [travelers, setTravelers] = useState(initial?.travelers?.toString() ?? '1')
  const [budget, setBudget] = useState(initial?.budget?.toString() ?? '')
  const [travelStyle, setTravelStyle] = useState(initial?.travelStyle ?? TRAVEL_STYLES[0])
  const [interests, setInterests] = useState<string[]>(initial?.interests ?? [])

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const toggleInterest = (interest: string) => {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((i) => i !== interest)
        : [...current, interest],
    )
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!destination.trim()) {
      setError('Destination is required')
      return
    }
    if (!startDate || !endDate) {
      setError('Start and end dates are required')
      return
    }
    if (startDate > endDate) {
      setError('End date must be on or after the start date')
      return
    }
    const travelersNum = Number(travelers)
    const budgetNum = Number(budget)
    if (!Number.isFinite(travelersNum) || travelersNum < 1) {
      setError('Travelers must be at least 1')
      return
    }
    if (!Number.isFinite(budgetNum) || budgetNum <= 0) {
      setError('Budget must be greater than zero')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim() || `Trip to ${destination.trim()}`,
        destination: destination.trim(),
        startDate,
        endDate,
        travelers: travelersNum,
        budget: budgetNum,
        travelStyle,
        interests,
      })
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save the trip. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          {error}
        </div>
      )}

      <label className={labelClass} htmlFor="title">
        Title <span className="font-normal text-slate-400">(optional — defaults to “Trip to {destination}”)</span>
      </label>
      <input
        id="title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={inputClass}
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
        className={inputClass}
        placeholder="Tokyo"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="startDate">
            Start date
          </label>
          <input
            id="startDate"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="endDate">
            End date
          </label>
          <input
            id="endDate"
            type="date"
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass} htmlFor="travelers">
            Travelers
          </label>
          <input
            id="travelers"
            type="number"
            min={1}
            required
            value={travelers}
            onChange={(e) => setTravelers(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="budget">
            Budget (USD)
          </label>
          <input
            id="budget"
            type="number"
            min={0.01}
            step={0.01}
            required
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className={inputClass}
            placeholder="3500.00"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="travelStyle">
            Travel style
          </label>
          <select
            id="travelStyle"
            value={travelStyle}
            onChange={(e) => setTravelStyle(e.target.value)}
            className={inputClass}
          >
            {TRAVEL_STYLES.map((style) => (
              <option key={style} value={style}>
                {style.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium text-slate-700">
          Interests <span className="font-normal text-slate-400">(multi-select)</span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {TRAVEL_INTERESTS.map((interest) => {
            const selected = interests.includes(interest)
            return (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                aria-pressed={selected}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  selected
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {interest}
              </button>
            )
          })}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}
