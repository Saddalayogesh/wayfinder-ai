import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ErrorState from '../components/common/ErrorState'
import Skeleton from '../components/common/Skeleton'
import { getErrorMessage } from '../services/api'
import { formatCurrency, formatDate, getSharedTrip, type Trip } from '../services/tripService'

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
      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <Skeleton className="h-4 w-24" />
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="mt-3 h-4 w-1/2" />
          <Skeleton className="mt-8 h-2 rounded-full" />
          <div className="mt-8 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      </main>
    )
  }

  if (state === 'error' || state === 'notfound' || !trip) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
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

  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
              ✨ Shared trip
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                {trip.title}
              </h1>
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                {trip.travelStyle.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {formatDate(trip.startDate)} – {formatDate(trip.endDate)} · {trip.travelers}{' '}
              {trip.travelers === 1 ? 'traveler' : 'travelers'} · {formatCurrency(trip.budget)}
            </p>
            {trip.interests.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {trip.interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Budget summary (read-only) */}
        <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Budget</h2>
            <span
              className={`text-xs font-semibold ${
                over ? 'text-rose-600' : pct >= 80 ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {over ? 'Over budget' : pct >= 80 ? 'Close to budget' : 'On track'}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
              <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Budget
              </div>
              <div className="mt-1 text-lg font-bold text-slate-900">
                {formatCurrency(trip.budget)}
              </div>
            </div>
            <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
              <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Estimated
              </div>
              <div className={`mt-1 text-lg font-bold ${over ? 'text-rose-600' : 'text-slate-900'}`}>
                {formatCurrency(estimated)}
              </div>
            </div>
            <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
              <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Remaining
              </div>
              <div className="mt-1 text-lg font-bold text-emerald-600">
                {trip.cost?.remaining != null ? formatCurrency(trip.cost.remaining) : '—'}
              </div>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all ${over ? 'bg-rose-500' : 'bg-emerald-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </section>

        {/* Itinerary (read-only) */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">Itinerary</h2>
          {trip.days.length === 0 ? (
            <div className="mt-4 rounded-xl border-2 border-dashed border-slate-300 p-8 text-center">
              <div className="text-3xl" aria-hidden="true">
                🏝️
              </div>
              <p className="mt-2 text-sm text-slate-500">This trip has no itinerary yet.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {trip.days.map((day) => (
                <div key={day.id} className="rounded-xl border border-slate-200">
                  <div className="rounded-t-xl border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <h3 className="text-sm font-bold text-slate-900">
                      Day {day.dayNumber}
                      <span className="ml-2 font-medium text-slate-500">
                        {formatDate(day.date)}
                      </span>
                    </h3>
                  </div>
                  {day.items.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-slate-400">
                      No places planned for this day.
                    </p>
                  ) : (
                    <ol className="divide-y divide-slate-100">
                      {day.items.map((item) => (
                        <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">
                            {item.sequenceOrder}
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {item.placeName}
                            </div>
                            {item.description && (
                              <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                            )}
                            <p className="mt-1 text-xs text-slate-400">
                              {item.estimatedCost != null && formatCurrency(item.estimatedCost)}
                              {item.estimatedCost != null && item.visitDuration != null && ' · '}
                              {item.visitDuration != null &&
                                `${
                                  item.visitDuration >= 60
                                    ? `${Math.floor(item.visitDuration / 60)}h${
                                        item.visitDuration % 60 ? ` ${item.visitDuration % 60}m` : ''
                                      }`
                                    : `${item.visitDuration}m`
                                }`}
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

        <div className="mt-10 border-t border-slate-100 pt-6 text-center">
          <Link to="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Plan your own trip with AI Trip Planner →
          </Link>
        </div>
      </div>
    </main>
  )
}
