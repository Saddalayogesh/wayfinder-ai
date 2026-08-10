import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import MapView, { type MapItem } from '../components/MapView'
import TripForm from '../components/TripForm'
import { getErrorMessage } from '../services/api'
import {
  addDay,
  addItem,
  deleteDay,
  deleteItem,
  deleteTrip,
  formatCurrency,
  formatDate,
  getTrip,
  updateTrip,
  type ItineraryItemInput,
  type Trip,
  type TripInput,
} from '../services/tripService'

type LoadState = 'loading' | 'ready' | 'error' | 'notfound'

export default function TripDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)

  const [showAddDay, setShowAddDay] = useState(false)
  const [newDayDate, setNewDayDate] = useState('')

  const [itemFormFor, setItemFormFor] = useState<number | null>(null)
  const [placeName, setPlaceName] = useState('')
  const [description, setDescription] = useState('')
  const [estimatedCost, setEstimatedCost] = useState('')
  const [visitDuration, setVisitDuration] = useState('')

  const [highlightedItemId, setHighlightedItemId] = useState<number | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setState('loading')
    try {
      setTrip(await getTrip(id))
      setState('ready')
    } catch (err) {
      const message = getErrorMessage(err, 'Could not load the trip.')
      setError(message)
      setState(message.toLowerCase().includes('not found') ? 'notfound' : 'error')
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const refresh = (updated: Trip) => {
    setTrip(updated)
    setSelectedItemId(null)
    setHighlightedItemId(null)
  }

  /** All itinerary items flattened with their day number, for the map. */
  const mapItems = useMemo<MapItem[]>(() => {
    if (!trip) return []
    return trip.days.flatMap((day) =>
      day.items.map((item) => ({
        id: item.id,
        name: item.placeName,
        latitude: item.latitude,
        longitude: item.longitude,
        dayNumber: day.dayNumber,
        description: item.description,
        estimatedCost: item.estimatedCost,
        visitDuration: item.visitDuration,
        rating: item.rating ?? null,
        photoUrl: item.photoUrl ?? null,
      })),
    )
  }, [trip])

  const mappedItemCount = mapItems.filter((i) => i.latitude != null && i.longitude != null).length

  /** Marker clicked -> highlight the matching list entry and scroll to it. */
  const handleMarkerSelect = (itemId: number) => {
    setSelectedItemId(itemId)
    setHighlightedItemId(itemId)
    document.getElementById(`trip-item-${itemId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  /** List entry hovered -> open/pan to its marker. */
  const handleItemHover = (itemId: number | null) => {
    setHighlightedItemId(itemId)
  }

  const handleEditSubmit = async (input: TripInput) => {
    if (!id) return
    setBusy(true)
    try {
      refresh(await updateTrip(id, input))
      setEditing(false)
      setError(null)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !trip) return
    if (!window.confirm(`Delete "${trip.title}"? This removes its days and places too.`)) return
    setBusy(true)
    try {
      await deleteTrip(id)
      navigate('/trips')
    } finally {
      setBusy(false)
    }
  }

  const handleAddDay = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!id || !newDayDate) return
    setBusy(true)
    try {
      refresh(await addDay(id, { date: newDayDate }))
      setNewDayDate('')
      setShowAddDay(false)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not add the day.'))
    } finally {
      setBusy(false)
    }
  }

  const handleAddItem = async (e: FormEvent<HTMLFormElement>, dayId: number) => {
    e.preventDefault()
    if (!id) return
    const input: ItineraryItemInput = {
      placeName,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(estimatedCost ? { estimatedCost: Number(estimatedCost) } : {}),
      ...(visitDuration ? { visitDuration: Number(visitDuration) } : {}),
    }
    setBusy(true)
    try {
      refresh(await addItem(id, dayId, input))
      setItemFormFor(null)
      setPlaceName('')
      setDescription('')
      setEstimatedCost('')
      setVisitDuration('')
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not add the place.'))
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteDay = async (dayId: number) => {
    if (!id) return
    if (!window.confirm('Delete this day and all its places?')) return
    setBusy(true)
    try {
      refresh(await deleteDay(id, dayId))
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete the day.'))
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteItem = async (dayId: number, itemId: number) => {
    if (!id) return
    if (!window.confirm('Remove this place from the itinerary?')) return
    setBusy(true)
    try {
      refresh(await deleteItem(id, dayId, itemId))
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete the place.'))
    } finally {
      setBusy(false)
    }
  }

  if (state === 'loading') {
    return (
      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
      </main>
    )
  }

  if (state === 'notfound' || state === 'error' || !trip) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <div className="text-4xl" aria-hidden="true">
          {state === 'notfound' ? '🧭' : '⚠️'}
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          {state === 'notfound' ? 'Trip not found' : 'Something went wrong'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {error ?? 'The trip does not exist or you do not have access to it.'}
        </p>
        <Link
          to="/trips"
          className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Back to my trips
        </Link>
      </main>
    )
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'

  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <Link to="/trips" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
        ← My trips
      </Link>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          {error}
        </div>
      )}

      {editing ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Edit trip</h2>
          <div className="mt-4">
            <TripForm
              initial={trip}
              submitLabel="Save changes"
              onSubmit={handleEditSubmit}
            />
          </div>
          <button
            onClick={() => setEditing(false)}
            className="mt-3 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
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
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                disabled={busy}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>

          {trip.interests.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
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

          {/* Interactive map */}
          {mapItems.some((i) => i.latitude != null && i.longitude != null) && (
            <section className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Map</h2>
                {mappedItemCount < mapItems.length && (
                  <span className="text-xs text-slate-400">
                    {mapItems.length - mappedItemCount} place{mapItems.length - mappedItemCount === 1 ? '' : 's'} without coordinates
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                Click a pin or a place below to find it on the other side.
              </p>
              <MapView
                className="mt-3"
                items={mapItems}
                highlightedId={highlightedItemId}
                onSelectItem={handleMarkerSelect}
              />
            </section>
          )}

          {/* Itinerary */}
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Itinerary</h2>
              <button
                onClick={() => setShowAddDay((v) => !v)}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                + Add day
              </button>
            </div>

            {showAddDay && (
              <form
                onSubmit={handleAddDay}
                className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div>
                  <label htmlFor="newDayDate" className="block text-sm font-medium text-slate-700">
                    Date
                  </label>
                  <input
                    id="newDayDate"
                    type="date"
                    required
                    value={newDayDate}
                    onChange={(e) => setNewDayDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {busy ? 'Adding…' : 'Add day'}
                </button>
              </form>
            )}

            {trip.days.length === 0 ? (
              <div className="mt-4 rounded-xl border-2 border-dashed border-slate-300 p-8 text-center">
                <div className="text-3xl" aria-hidden="true">
                  🏝️
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  No itinerary yet. Add a day to start sketching your trip, or wait for AI
                  planning to do it for you.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {trip.days.map((day) => (
                  <div key={day.id} className="rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between rounded-t-xl border-b border-slate-200 bg-slate-50 px-4 py-3">
                      <h3 className="text-sm font-bold text-slate-900">
                        Day {day.dayNumber}
                        <span className="ml-2 font-medium text-slate-500">
                          {formatDate(day.date)}
                        </span>
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (itemFormFor === day.id) {
                              setItemFormFor(null)
                            } else {
                              setPlaceName('')
                              setDescription('')
                              setEstimatedCost('')
                              setVisitDuration('')
                              setItemFormFor(day.id)
                            }
                          }}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          {itemFormFor === day.id ? 'Cancel' : '+ Add place'}
                        </button>
                        <button
                          onClick={() => handleDeleteDay(day.id)}
                          disabled={busy}
                          className="text-sm font-medium text-rose-500 hover:text-rose-600 disabled:opacity-50"
                        >
                          Delete day
                        </button>
                      </div>
                    </div>

                    {itemFormFor === day.id && (
                      <form
                        onSubmit={(e) => handleAddItem(e, day.id)}
                        className="grid gap-3 border-b border-slate-200 bg-indigo-50/50 p-4 sm:grid-cols-2"
                      >
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            required
                            value={placeName}
                            onChange={(e) => setPlaceName(e.target.value)}
                            placeholder="Place name (e.g. Senso-ji Temple)"
                            className={inputClass}
                          />
                        </div>
                        <input
                          type="text"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Short description (optional)"
                          className={inputClass}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={estimatedCost}
                            onChange={(e) => setEstimatedCost(e.target.value)}
                            placeholder="Cost (USD)"
                            className={inputClass}
                          />
                          <input
                            type="number"
                            min={0}
                            value={visitDuration}
                            onChange={(e) => setVisitDuration(e.target.value)}
                            placeholder="Minutes"
                            className={inputClass}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={busy}
                          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:col-span-2"
                        >
                          {busy ? 'Adding…' : 'Add place'}
                        </button>
                      </form>
                    )}

                    {day.items.length === 0 ? (
                      <p className="px-4 py-4 text-sm text-slate-400">No places planned for this day.</p>
                    ) : (
                      <ol className="divide-y divide-slate-100">
                        {day.items.map((item) => (
                          <li
                            key={item.id}
                            id={`trip-item-${item.id}`}
                            onMouseEnter={() => handleItemHover(item.id)}
                            onMouseLeave={() => handleItemHover(null)}
                            onClick={() => handleMarkerSelect(item.id)}
                            className={`flex cursor-pointer items-start justify-between gap-3 px-4 py-3 transition-colors ${
                              selectedItemId === item.id
                                ? 'bg-indigo-50 ring-1 ring-inset ring-indigo-300'
                                : highlightedItemId === item.id
                                  ? 'bg-indigo-50/60'
                                  : 'hover:bg-slate-50'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">
                                  {item.sequenceOrder}
                                </span>
                                <span className="text-sm font-semibold text-slate-900">
                                  {item.placeName}
                                </span>
                              </div>
                              {item.description && (
                                <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                              )}
                              <p className="mt-1 text-xs text-slate-400">
                                {item.latitude == null || item.longitude == null ? (
                                  <span className="text-slate-300">no map pin</span>
                                ) : (
                                  '📍'
                                )}
                                {item.estimatedCost != null && `  ${formatCurrency(item.estimatedCost)}`}
                                {item.estimatedCost != null && item.visitDuration != null && ' · '}
                                {item.visitDuration != null &&
                                  `${item.visitDuration >= 60 ? `${Math.floor(item.visitDuration / 60)}h${item.visitDuration % 60 ? ` ${item.visitDuration % 60}m` : ''}` : `${item.visitDuration}m`}`}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteItem(day.id, item.id)}
                              disabled={busy}
                              className="shrink-0 text-sm font-medium text-rose-400 hover:text-rose-600 disabled:opacity-50"
                              aria-label={`Delete ${item.placeName}`}
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  )
}
