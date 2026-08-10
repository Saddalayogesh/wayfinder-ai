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
import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import ErrorState from '../components/common/ErrorState'
import Skeleton from '../components/common/Skeleton'

type LoadState = 'loading' | 'ready' | 'error'

/** Skeleton trip-card grid shown while trips load. */
function TripCardSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-2 h-4 w-1/3" />
      <div className="mt-5 space-y-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
      <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
    </Card>
  )
}

export default function MyTrips() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [error, setError] = useState<{ message: string; status: number | null } | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setState('loading')
    setError(null)
    try {
      setTrips(await getTrips())
      setState('ready')
    } catch (err) {
      const axiosError = err as { response?: { status?: number } }
      setError({
        message: getErrorMessage(err, 'Could not load your trips.'),
        status: axiosError.response?.status ?? null,
      })
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
      setError({ message: getErrorMessage(err, 'Could not delete the trip.'), status: null })
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
        <Link to="/trips/new">
          <Button size="md">+ New trip</Button>
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          {error.message}
        </div>
      )}

      {state === 'loading' && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <TripCardSkeleton key={i} />
          ))}
        </div>
      )}

      {state === 'error' && (
        <div className="mt-10">
          <ErrorState message={error?.message ?? ''} status={error?.status} onRetry={load} />
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
          <Link to="/trips/new" className="mt-6 inline-block">
            <Button>Plan your first trip</Button>
          </Link>
        </div>
      )}

      {state === 'ready' && trips.length > 0 && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <Card
              key={trip.id}
              className="group flex flex-col p-6 hover:-translate-y-1 hover:shadow-raised"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-900">{trip.destination}</h2>
                <Badge color="indigo" className="shrink-0">
                  {trip.travelStyle.replace(/_/g, ' ')}
                </Badge>
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
                    <Badge key={interest} color="slate">
                      {interest}
                    </Badge>
                  ))}
                  {trip.interests.length > 4 && (
                    <Badge color="slate">+{trip.interests.length - 4}</Badge>
                  )}
                </div>
              )}

              <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
                <Link to={`/trips/${trip.id}`} className="flex-1">
                  <Button className="w-full">View itinerary</Button>
                </Link>
                <Button
                  variant="danger"
                  loading={deletingId === trip.id}
                  disabled={deletingId != null}
                  onClick={() => handleDelete(trip)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
