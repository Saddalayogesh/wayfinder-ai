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
import ResponsiveImg from '../components/common/ResponsiveImg'
import Skeleton from '../components/common/Skeleton'
import TripCover from '../components/common/TripCover'
import { CalendarDays, Plus, Trash2, Users, Wallet } from 'lucide-react'

type LoadState = 'loading' | 'ready' | 'error'

/** Skeleton trip-card grid shown while trips load — shaped like real cards. */
function TripCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-40 rounded-none" />
      <div className="p-6">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="mt-2 h-4 w-1/3" />
        <div className="mt-5 space-y-2.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
        <div className="mt-5 flex gap-2 border-t border-border/60 pt-4">
          <Skeleton className="h-9 flex-1 rounded-xl" />
          <Skeleton className="h-9 w-20 rounded-xl" />
        </div>
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
    <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            Your adventures
          </p>
          <h1 className="mt-3 font-display text-4xl font-normal tracking-tight text-text sm:text-5xl">
            My trips
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            Every adventure you've started planning, in one place.
          </p>
        </div>
        <Link to="/trips/new">
          <Button>
            <Plus size={16} aria-hidden="true" />
            New trip
          </Button>
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-8 rounded-xl border border-error/25 bg-error/10 px-4 py-3 text-sm text-error"
        >
          {error.message}
        </div>
      )}

      {state === 'loading' && (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <TripCardSkeleton key={i} />
          ))}
        </div>
      )}

      {state === 'error' && (
        <div className="mt-12">
          <ErrorState message={error?.message ?? ''} status={error?.status} onRetry={load} />
        </div>
      )}

      {state === 'ready' && trips.length === 0 && (
        <div className="relative mt-16 overflow-hidden rounded-2xl border border-border/70 bg-surface px-8 py-20 text-center">
          {/* Muted photography behind the empty state, not just an icon. */}
          <ResponsiveImg
            src="/images/empty-trips.jpg"
            sizes="100vw"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full opacity-20"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-surface/40" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
          />
          <div className="relative">
            <h2 className="font-display text-3xl font-normal tracking-tight text-text">
              Start your first journey
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
              Your planned adventures will live here — complete with AI-built
              itineraries, maps, and budgets.
            </p>
            <Link to="/trips/new" className="mt-8 inline-block">
              <Button size="lg">
                <Plus size={16} aria-hidden="true" />
                Plan your first trip
              </Button>
            </Link>
          </div>
        </div>
      )}

      {state === 'ready' && trips.length > 0 && (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <Card
              key={trip.id}
              className="group flex flex-col overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
            >
              {/* Destination cover photo — top third of the card. */}
              <Link
                to={`/trips/${trip.id}`}
                className="relative block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/60"
              >
                <TripCover
                  label={trip.destination}
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                  imgClassName="transition-transform duration-500 group-hover:scale-105"
                  className="h-44"
                />
                <Badge
                  color="primary"
                  className="absolute left-4 top-4 border-border bg-background/80 backdrop-blur-md"
                >
                  {trip.travelStyle.replace(/_/g, ' ')}
                </Badge>
                {/* Accent-tinted budget pill — clearly visible over the photo. */}
                <span className="absolute bottom-3 right-4 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/15 px-3 py-1 text-xs font-semibold text-accent backdrop-blur-md">
                  <Wallet size={12} aria-hidden="true" />
                  {formatCurrency(trip.budget, trip.currency)}
                </span>
              </Link>

              <div className="flex flex-1 flex-col p-6">
                <h2 className="font-display text-xl font-semibold tracking-tight text-text">
                  {trip.destination}
                </h2>
                <p className="mt-1 text-sm text-muted">{trip.title}</p>

                <dl className="mt-5 space-y-2.5 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-2 text-muted">
                      <CalendarDays size={15} aria-hidden="true" />
                      Dates
                    </dt>
                    <dd className="font-medium text-text">
                      {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-2 text-muted">
                      <Users size={15} aria-hidden="true" />
                      Travelers
                    </dt>
                    <dd className="font-medium text-text">
                      {trip.travelers} {trip.travelers === 1 ? 'person' : 'people'}
                    </dd>
                  </div>
                </dl>

                {trip.interests.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-1.5">
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

                <div className="mt-6 flex items-center gap-2 border-t border-border/60 pt-5">
                  <Link to={`/trips/${trip.id}`} className="flex-1">
                    <Button variant="secondary" className="w-full">
                      View itinerary
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
                    loading={deletingId === trip.id}
                    disabled={deletingId != null}
                    onClick={() => handleDelete(trip)}
                    aria-label={`Delete ${trip.title}`}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
