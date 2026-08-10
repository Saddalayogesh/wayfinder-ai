import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TripForm from '../components/TripForm'
import { getErrorMessage } from '../services/api'
import { generateTrip, createTrip, type TripInput } from '../services/tripService'

const GENERATION_MESSAGES = [
  'Analyzing destination…',
  'Planning activities…',
  'Optimizing itinerary…',
  'Finding places…',
]

export default function CreateTrip() {
  const navigate = useNavigate()

  const [generating, setGenerating] = useState(false)
  const [messageIndex, setMessageIndex] = useState(0)
  const [generationError, setGenerationError] = useState<string | null>(null)

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

  return (
    <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Plan a new trip</h1>
        <p className="mt-1 text-sm text-slate-500">
          Let Gemini build a day-by-day itinerary, or save your own draft.
        </p>

        {generationError && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            <span className="font-semibold">The AI planner hit a snag.</span>{' '}
            {generationError}
          </div>
        )}

        {generating ? (
          <div className="mt-10 flex flex-col items-center py-16 text-center">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl" aria-hidden="true">
                ✨
              </div>
            </div>
            <p className="mt-6 text-lg font-semibold text-slate-900">
              {GENERATION_MESSAGES[messageIndex]}
            </p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Gemini is crafting your {messageIndex < 2 ? 'itinerary' : 'places'} — this usually
              takes a few seconds.
            </p>
            <div className="mt-6 flex gap-1.5">
              {GENERATION_MESSAGES.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === messageIndex ? 'w-6 bg-indigo-600' : 'w-1.5 bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <TripForm
              submitLabel="Save as draft"
              onSubmit={handleSaveDraft}
              onGenerate={handleGenerate}
              generating={generating}
            />
          </div>
        )}
      </div>
    </main>
  )
}
