import { useNavigate } from 'react-router-dom'
import TripForm from '../components/TripForm'
import { createTrip, type TripInput } from '../services/tripService'

export default function CreateTrip() {
  const navigate = useNavigate()

  const handleSubmit = async (input: TripInput) => {
    await createTrip(input)
    navigate('/trips', { replace: true })
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Plan a new trip</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tell us the basics — AI itinerary generation lands in a future phase.
        </p>
        <div className="mt-6">
          <TripForm submitLabel="Create trip" onSubmit={handleSubmit} />
        </div>
      </div>
    </main>
  )
}
