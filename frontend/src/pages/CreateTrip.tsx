import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TripForm from '../components/TripForm'
import TripCover from '../components/common/TripCover'
import { getErrorMessage } from '../services/api'
import { generateTrip, createTrip, formatCurrency, formatDate, type TripInput } from '../services/tripService'
import { CalendarDays, MapPin, Sparkles, Users, Wallet } from 'lucide-react'

const GENERATION_MESSAGES = [
  'Analyzing destination…',
  'Planning activities…',
  'Optimizing itinerary…',
  'Finding places…',
]

interface Draft {
  destination: string
  startDate: string
  endDate: string
  travelers: string
  budget: string
  currency: string
  travelStyle: string
  interests: string[]
}

const EMPTY_DRAFT: Draft = {
  destination: '',
  startDate: '',
  endDate: '',
  travelers: '1',
  budget: '',
  currency: 'USD',
  travelStyle: '',
  interests: [],
}

export default function CreateTrip() {
  const navigate = useNavigate()

  const [generating, setGenerating] = useState(false)
  const [messageIndex, setMessageIndex] = useState(0)
  const [generationError, setGenerationError] = useState<string | null>(null)

  // Live draft mirror + debounced destination for the preview panel.
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [previewDestination, setPreviewDestination] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPreviewDestination(draft.destination.trim())
    }, 350)
    return () => window.clearTimeout(timer)
  }, [draft.destination])

  // Cycle the loading messages while Gemini is working.
  useEffect(() => {
    if (!generating) return
    setMessageIndex(0)
    const interval = window.setInterval(() => {
      setMessageIndex((i) => (i + 1) % GENERATION_MESSAGES.length)
    }, 2000)
    return () => window.clearInterval(interval)
  }, [generating])

  const handleGenerate = async (input: TripInput) => {
    setGenerationError(null)
    setGenerating(true)
    try {
      const trip = await generateTrip(input)
      navigate(`/trips/${trip.id}`, { replace: true })
    } catch (err) {
      const detail = getErrorMessage(err, '')
      setGenerationError(
        detail && detail.length < 160
          ? detail
          : 'Gemini could not plan this trip right now. Please try again in a few minutes.',
      )
      setGenerating(false)
    }
    // On success we navigate away; on error the finally-style reset above runs.
  }

  const handleSaveDraft = async (input: TripInput) => {
    setGenerationError(null)
    await createTrip(input)
    navigate('/trips', { replace: true })
  }

  const hasDates = Boolean(draft.startDate && draft.endDate)

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      {/* Page header */}
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
          New adventure
        </p>
        <h1 className="mt-3 font-display text-4xl font-normal tracking-tight text-text sm:text-5xl">
          Plan your next journey
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Tell us where and how you want to travel — we'll handle the rest.
        </p>
      </div>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[3fr_2fr] lg:gap-10">
        {/* ---- Form column ---- */}
        <div className="panel p-7 sm:p-10">
          {generationError && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300"
            >
              <span className="font-semibold">The AI planner hit a snag.</span> {generationError}
            </div>
          )}

          {generating ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="relative h-20 w-20">
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                <div className="absolute inset-0 flex items-center justify-center text-primary">
                  <Sparkles size={26} aria-hidden="true" />
                </div>
              </div>
              <p className="mt-8 font-display text-2xl font-normal tracking-tight text-text">
                {GENERATION_MESSAGES[messageIndex]}
              </p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
                Gemini is crafting your {messageIndex < 2 ? 'itinerary' : 'places'} — this usually
                takes a few seconds.
              </p>
              <div className="mt-8 flex gap-1.5">
                {GENERATION_MESSAGES.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === messageIndex ? 'w-8 bg-primary' : 'w-1.5 bg-border'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <TripForm
              submitLabel="Save as draft"
              onSubmit={handleSaveDraft}
              onGenerate={handleGenerate}
              generating={generating}
              onDraftChange={setDraft}
            />
          )}
        </div>

        {/* ---- Live preview column ---- */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          {/* Destination photo — updates as the user types (debounced). */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">
              Destination preview
            </p>
            <div className="media-frame mt-3 overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-lg shadow-black/15 dark:shadow-black/30">
              <TripCover
                label={previewDestination || 'Japan'}
                sizes="(min-width: 1024px) 32rem, 100vw"
                imgClassName="transition-all duration-700"
                className="aspect-[4/3] w-full"
              />
            </div>
            <p className="mt-2.5 text-xs text-muted">
              {previewDestination
                ? `A glimpse of ${previewDestination} — the AI will build your itinerary around it.`
                : 'Start typing a destination to see a preview.'}
            </p>
          </div>

          {/* Running summary — fills in as fields are completed. */}
          <div className="rounded-2xl border border-border/70 bg-surface p-6 shadow-lg shadow-black/15 dark:shadow-black/30">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">
              Trip summary
            </p>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-muted">
                  <MapPin size={15} aria-hidden="true" />
                  Destination
                </dt>
                <dd className={`truncate font-medium ${draft.destination ? 'text-text' : 'text-muted/50'}`}>
                  {draft.destination || 'Not set yet'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-muted">
                  <CalendarDays size={15} aria-hidden="true" />
                  Dates
                </dt>
                <dd className={`text-right font-medium ${hasDates ? 'text-text' : 'text-muted/50'}`}>
                  {hasDates
                    ? `${formatDate(draft.startDate)} – ${formatDate(draft.endDate)}`
                    : 'Not set yet'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-muted">
                  <Users size={15} aria-hidden="true" />
                  Travelers
                </dt>
                <dd className="font-medium text-text">
                  {Number(draft.travelers) || 1} {Number(draft.travelers) === 1 ? 'person' : 'people'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-muted">
                  <Wallet size={15} aria-hidden="true" />
                  Budget
                </dt>
                <dd className={`font-medium ${draft.budget ? 'text-accent' : 'text-muted/50'}`}>
                  {draft.budget ? formatCurrency(Number(draft.budget), draft.currency) : 'Not set yet'}
                </dd>
              </div>
              {draft.interests.length > 0 && (
                <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
                  <dt className="flex items-center gap-2 text-muted">
                    <Sparkles size={15} aria-hidden="true" />
                    Interests
                  </dt>
                  <dd className="truncate text-right font-medium text-text">
                    {draft.interests.join(', ')}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </aside>
      </div>
    </main>
  )
}
