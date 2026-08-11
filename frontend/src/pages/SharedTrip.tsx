import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ErrorState from '../components/common/ErrorState'
import Skeleton from '../components/common/Skeleton'
import TripCover from '../components/common/TripCover'
import Badge from '../components/common/Badge'
import { getErrorMessage } from '../services/api'
import { formatCurrency, formatDate, getSharedTrip, type Trip } from '../services/tripService'
import { CalendarDays, Clock, MapPin, Sparkles } from 'lucide-react'

type LoadState = 'loading' | 'ready' | 'error' | 'notfound'

/**
 * Public, read-only view of a shared trip. No authentication is required —
 * access is guarded by the random share token in the URL. There are
 * deliberately no edit/delete controls on this page.
 */
export default function SharedTrip() {
  const { token } = useParams<{ token: string }>()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)
  const [loadStatus, setLoadStatus] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setState('loading')
    setError(null)
    setLoadStatus(null)
    try {
      setTrip(await getSharedTrip(token))
      setState('ready')
    } catch (err) {
      const message = getErrorMessage(err, 'This shared trip could not be loaded.')
      setError(message)
      setLoadStatus((err as { response?: { status?: number } }).response?.status ?? null)
      setState(message.toLowerCase().includes('not found') ? 'notfound' : 'error')
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  if (state === 'loading') {
    return (
      <main className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <Skeleton className="h-4 w-32" />
        <div className="mt-6 overflow-hidden rounded-2xl border border-border/70 bg-surface">
          <Skeleton className="h-52 rounded-none sm:h-64" />
          <div className="p-8">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="mt-3 h-4 w-1/2" />
            <Skeleton className="mt-8 h-1.5 rounded-full" />
            <div className="mt-8 grid grid-cols-3 gap-3">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
            <div className="mt-8 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-40 rounded-xl" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (state === 'error' || state === 'notfound' || !trip) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="rounded-2xl border border-border/70 bg-surface p-8 shadow-panel sm:p-10">
          <ErrorState
            message={
              state === 'notfound'
                ? 'This share link is invalid or the trip no longer exists.'
                : error ?? 'This shared trip could not be loaded.'
            }
            status={loadStatus}
            onRetry={() => void load()}
          />
        </div>
      </main>
    )
  }

  const estimated = trip.cost?.estimatedTotal ?? 0
  const pct = trip.budget > 0 ? Math.min(100, (estimated / trip.budget) * 100) : 0
  const over = trip.budget > 0 && estimated > trip.budget
  const overBy = trip.cost?.remaining != null && trip.cost.remaining < 0

  return (
    <main className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-panel">
        {/* Destination cover banner */}
        <div className="relative h-52 sm:h-64">
          <TripCover
            label={trip.destination}
            sizes="(min-width: 1024px) 64rem, 100vw"
            className="h-full"
            scrim={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-background/15" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              <Sparkles size={14} aria-hidden="true" />
              Shared trip
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-normal tracking-tight text-text sm:text-4xl">
                {trip.title}
              </h1>
              <Badge color="primary" className="border-border bg-background/80 backdrop-blur-md">
                {trip.travelStyle.replace(/_/g, ' ')}
              </Badge>
            </div>
            <p className="mt-2.5 text-sm text-muted">
              {formatDate(trip.startDate)} – {formatDate(trip.endDate)} · {trip.travelers}{' '}
              {trip.travelers === 1 ? 'traveler' : 'travelers'} · {formatCurrency(trip.budget, trip.currency)}
            </p>
            {trip.interests.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {trip.interests.map((interest) => (
                  <Badge key={interest} color="slate" className="border-border bg-background/80 backdrop-blur-md">
                    {interest}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {/* Budget summary (read-only) */}
          <section>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-text">
                Budget
              </h2>
              <span
                className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                  over
                    ? 'text-amber-600 dark:text-amber-300'
                    : pct >= 80
                      ? 'text-amber-600 dark:text-amber-300'
                      : 'text-success'
                }`}
              >
                {over ? 'Over budget' : pct >= 80 ? 'Close to budget' : 'On track'}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-background/40 p-5">
                <div className="text-[13px] font-medium uppercase tracking-[0.18em] text-muted">
                  Budget
                </div>
                <div className="mt-2 font-display text-[28px] font-normal leading-tight tracking-tight text-text">
                  {formatCurrency(trip.budget, trip.currency)}
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/40 p-5">
                <div className="text-[13px] font-medium uppercase tracking-[0.18em] text-muted">
                  Estimated
                </div>
                <div
                  className={`mt-2 font-display text-[28px] font-normal leading-tight tracking-tight ${
                    over ? 'text-amber-600 dark:text-amber-300' : 'text-text'
                  }`}
                >
                  {formatCurrency(estimated, trip.currency)}
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/40 p-5">
                <div className="text-[13px] font-medium uppercase tracking-[0.18em] text-muted">
                  Remaining
                </div>
                <div
                  className={`mt-2 font-display text-[28px] font-normal leading-tight tracking-tight ${
                    overBy ? 'text-amber-600 dark:text-amber-300' : 'text-success'
                  }`}
                >
                  {trip.cost?.remaining != null
                    ? formatCurrency(trip.cost.remaining, trip.currency)
                    : '—'}
                </div>
              </div>
            </div>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  over                      ? 'bg-gradient-to-r from-error to-error/80'
                    : 'bg-gradient-to-r from-primary to-accent'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </section>

          {/* Itinerary (read-only) */}
          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-text">
              Itinerary
            </h2>
            {trip.days.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-border/70 bg-background/30 px-8 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CalendarDays size={22} aria-hidden="true" />
                </div>
                <p className="mt-4 text-sm text-muted">This trip has no itinerary yet.</p>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {trip.days.map((day) => (
                  <div
                    key={day.id}
                    className="overflow-hidden rounded-2xl border border-border/60 bg-background/20"
                  >
                    <div className="border-b border-border/60 bg-surface px-5 py-4">
                      <h3 className="font-display text-xl font-normal tracking-tight text-text">
                        Day {day.dayNumber}
                        <span className="ml-2 font-sans text-sm font-medium tracking-normal text-muted">
                          {formatDate(day.date)}
                        </span>
                      </h3>
                    </div>
                    {day.items.length === 0 ? (
                      <p className="px-5 py-5 text-sm text-muted">No places planned for this day.</p>
                    ) : (
                      <ol className="divide-y divide-border/60">
                        {day.items.map((item) => (
                          <li key={item.id} className="flex items-start gap-4 px-5 py-4">
                            <TripCover
                              label={item.placeName}
                              src={item.photoUrl}
                              scrim={false}
                              className="mt-0.5 h-12 w-12 shrink-0 rounded-xl"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                                  {item.sequenceOrder}
                                </span>
                                <span className="text-sm font-semibold text-text">
                                  {item.placeName}
                                </span>
                              </div>
                              {item.description && (
                                <p className="mt-1 text-sm leading-relaxed text-muted">
                                  {item.description}
                                </p>
                              )}
                              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                                {item.latitude != null && item.longitude != null && (
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin size={12} aria-hidden="true" />
                                    on map
                                  </span>
                                )}
                                {item.estimatedCost != null && (
                                  <span>{formatCurrency(item.estimatedCost, trip.currency)}</span>
                                )}
                                {item.visitDuration != null && (
                                  <span className="inline-flex items-center gap-1">
                                    <Clock size={12} aria-hidden="true" />
                                    {item.visitDuration >= 60
                                      ? `${Math.floor(item.visitDuration / 60)}h${
                                          item.visitDuration % 60 ? ` ${item.visitDuration % 60}m` : ''
                                        }`
                                      : `${item.visitDuration}m`}
                                  </span>
                                )}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="mt-12">
            <div className="divider" />
            <div className="pt-8 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-accent transition-colors duration-200 hover:text-accent/80"
              >
                Plan your own trip with Wayfinder AI
                <Sparkles size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
