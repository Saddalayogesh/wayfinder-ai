import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '../services/api'
import {
  deleteTrip,
  formatCurrency,
  formatDate,
  getTrips,
  type Trip,
} from '../services/tripService'

type LoadState = 'loading' | 'ready' | 'error'

export default function MyTrips() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setState('loading')
    try {
      setTrips(await getTrips())
      setState('ready')
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your trips.'))
      setState('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleDelete = async (trip: Trip) => {
    if (!window.confirm(`Delete "${trip.title}"? This removes its itinerary too.`)) return
    setDeletingId(trip.id)
    try {
      await deleteTrip(trip.id)
      setTrips((current) => current.filter((t) => t.id !== trip.id))
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete the trip.'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">My trips</h1>
          <p className="mt-1 text-sm text-slate-500">
            Every adventure you've started planning, in one place.
          </p>
        </div>
        <Link
          to="/trips/new"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700"
        >
          + New trip
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          {error}
        </div>
      )}

      {state === 'loading' && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
          ))}
        </div>
      )}

      {state === 'ready' && trips.length === 0 && (
        <div className="mt-16 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="text-4xl" aria-hidden="true">
            🗺️
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">No trips yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Plan your first adventure and it will show up here as a card.
          </p>
          <Link
            to="/trips/new"
            className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Plan your first trip
          </Link>
        </div>
      )}

      {state === 'ready' && trips.length > 0 && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <article
              key={trip.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-900">{trip.destination}</h2>
                <span className="shrink-0 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                  {trip.travelStyle.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-500">{trip.title}</p>

              <dl className="mt-4 space-y-1.5 text-sm text-slate-600">
                <div className="flex justify-between gap-2">
                  <dt>Dates</dt>
                  <dd className="font-medium text-slate-800">
                    {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Travelers</dt>
                  <dd className="font-medium text-slate-800">
                    {trip.travelers} {trip.travelers === 1 ? 'person' : 'people'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Budget</dt>
                  <dd className="font-medium text-slate-800">{formatCurrency(trip.budget)}</dd>
                </div>
              </dl>

              {trip.interests.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {trip.interests.slice(0, 4).map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                    >
                      {interest}
                    </span>
                  ))}
                  {trip.interests.length > 4 && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                      +{trip.interests.length - 4}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
                <Link
                  to={`/trips/${trip.id}`}
                  className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  View itinerary
                </Link>
                <button
                  onClick={() => handleDelete(trip)}
                  disabled={deletingId === trip.id}
                  className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                >
                  {deletingId === trip.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
