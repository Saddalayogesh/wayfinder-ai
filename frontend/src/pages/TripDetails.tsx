import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import MapView, { type MapItem } from '../components/MapView'
import TripForm from '../components/TripForm'
import DatePicker from '../components/common/DatePicker'
import ErrorState from '../components/common/ErrorState'
import Modal from '../components/common/Modal'
import Skeleton from '../components/common/Skeleton'
import TripCover from '../components/common/TripCover'
import Badge from '../components/common/Badge'
import { getErrorMessage } from '../services/api'
import {
  addDay,
  addItem,
  deleteDay,
  deleteItem,
  deleteTrip,
  downloadTripPdf,
  formatCurrency,
  formatDate,
  getTrip,
  regenerateDay,
  shareTrip,
  updateTrip,
  type ItineraryItemInput,
  type Trip,
  type TripInput,
} from '../services/tripService'
import {
  ArrowLeft,
  CalendarPlus,
  Clock,
  Download,
  MapPin,
  Pencil,
  Plus,
  Share2,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'

type LoadState = 'loading' | 'ready' | 'error' | 'notfound'

/** Ghost icon + label toolbar button (share / PDF / edit / delete). */
const toolbarClass =
  'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:bg-surface-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-50'

/** Compact ghost button for the photo banner — blurred backdrop so it reads over the image. */
const bannerToolbarClass =
  'inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/60 px-3 py-1.5 text-xs font-medium text-text backdrop-blur transition-colors duration-200 hover:border-text/30 hover:bg-background/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-50'

const inputClass = 'input'

export default function TripDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)
  const [loadStatus, setLoadStatus] = useState<number | null>(null)
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

  // Day regeneration: which day's modal is open, its text, and which day is in-flight.
  const [regenerateDayNumber, setRegenerateDayNumber] = useState<number | null>(null)
  const [regenerateInstruction, setRegenerateInstruction] = useState('')
  const [regeneratingDay, setRegeneratingDay] = useState<number | null>(null)

  // Sharing + PDF export.
  const [shareOpen, setShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [shareBusy, setShareBusy] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [downloadBusy, setDownloadBusy] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setState('loading')
    setError(null)
    setLoadStatus(null)
    try {
      setTrip(await getTrip(id))
      setState('ready')
    } catch (err) {
      const message = getErrorMessage(err, 'Could not load the trip.')
      const axiosError = err as { response?: { status?: number } }
      setError(message)
      setLoadStatus(
        axiosError.response?.status ?? (message.toLowerCase().includes('not found') ? 404 : null),
      )
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

  /** Generates (or returns the existing) share token and opens the link modal. */
  const handleShare = async () => {
    if (!id || shareBusy) return
    setShareBusy(true)
    setError(null)
    try {
      const { shareUrl: url } = await shareTrip(id)
      setShareUrl(url)
      setShareCopied(false)
      setShareOpen(true)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create the share link.'))
    } finally {
      setShareBusy(false)
    }
  }

  const handleCopyShareLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareCopied(true)
      window.setTimeout(() => setShareCopied(false), 2000)
    } catch {
      // Clipboard API unavailable (e.g. non-secure context): select the text so
      // the user can copy manually.
      const input = document.getElementById('share-url-input') as HTMLInputElement | null
      input?.select()
    }
  }

  /** Streams the owner-only PDF and saves it to disk. */
  const handleDownloadPdf = async () => {
    if (!id || !trip || downloadBusy) return
    setDownloadBusy(true)
    setError(null)
    try {
      const blob = await downloadTripPdf(id)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `trip-${id}-${trip.destination.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      // Revoke on a later tick — revoking synchronously can cancel the
      // in-flight download in some browsers (notably Firefox).
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not download the PDF.'))
    } finally {
      setDownloadBusy(false)
    }
  }

  /** Gemini re-plans one day; every other day stays untouched. */
  const handleRegenerate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!id || regenerateDayNumber == null || !regenerateInstruction.trim()) return
    const target = regenerateDayNumber
    setBusy(true) // also locks trip-level Edit/Delete while the AI is working
    setRegeneratingDay(target)
    try {
      refresh(await regenerateDay(id, target, regenerateInstruction.trim()))
      setRegenerateDayNumber(null)
      setRegenerateInstruction('')
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not regenerate this day. Please try again in a few minutes.'))
    } finally {
      setRegeneratingDay(null)
      setBusy(false)
    }
  }

  if (state === 'loading') {
    return (
      <main className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <Skeleton className="h-4 w-28" />
        <div className="mt-6 overflow-hidden rounded-2xl border border-border/70 bg-surface">
          <Skeleton className="h-52 rounded-none sm:h-64" />
          <div className="p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="w-full sm:w-2/3">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="mt-3 h-4 w-1/2" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="h-9 w-20 rounded-lg" />
              </div>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
            <Skeleton className="mt-3 h-1.5 rounded-full" />
            <Skeleton className="mt-8 h-80 rounded-xl" />
            <div className="mt-8 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (state === 'notfound' || state === 'error' || !trip) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <Link
          to="/trips"
          className="inline-flex items-center gap-2 text-sm font-medium text-accent transition-colors duration-200 hover:text-accent/80"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          My trips
        </Link>
        <div className="mt-8">
          <ErrorState
            message={error ?? 'The trip does not exist or you do not have access to it.'}
            status={loadStatus}
            onRetry={() => void load()}
          />
        </div>
      </main>
    )
  }

  // Budget summary numbers (recomputed on every render, so they stay live
  // after regenerations and edits).
  const estimated = trip.cost?.estimatedTotal ?? 0
  const remaining = trip.cost?.remaining ?? null
  const pct = trip.budget > 0 ? Math.min(100, (estimated / trip.budget) * 100) : 0
  const over = trip.budget > 0 && estimated > trip.budget
  const overBy = remaining != null && remaining < 0

  return (
    <main className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
      <Link
        to="/trips"
        className="inline-flex items-center gap-2 text-sm font-medium text-accent transition-colors duration-200 hover:text-accent/80"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        My trips
      </Link>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-error/25 bg-error/10 px-4 py-3 text-sm text-error"
        >
          {error}
        </div>
      )}

      {editing ? (
        <div className="panel mt-6 p-7 sm:p-10">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-text">Edit trip</h2>
          <div className="mt-6">
            <TripForm initial={trip} submitLabel="Save changes" onSubmit={handleEditSubmit} />
          </div>
          <button
            onClick={() => setEditing(false)}
            className="mt-4 text-sm font-medium text-muted transition-colors duration-200 hover:text-text"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="panel mt-6 overflow-hidden">
          {/* Destination cover banner */}
          <div className="relative h-52 sm:h-64">
            <TripCover
              label={trip.destination}
              sizes="(min-width: 1024px) 64rem, 100vw"
              className="h-full"
              scrim={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-background/15" />
            {/* Share / PDF — ghost buttons over the banner's top-right. */}
            <div className="absolute right-4 top-4 flex flex-wrap items-center gap-2 sm:right-6 sm:top-6">
              <button
                onClick={handleShare}
                disabled={busy || shareBusy}
                className={bannerToolbarClass}
              >
                <Share2 size={15} aria-hidden="true" />
                {shareBusy ? 'Preparing…' : 'Share'}
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={busy || downloadBusy}
                className={bannerToolbarClass}
              >
                <Download size={15} aria-hidden="true" />
                {downloadBusy ? 'Preparing…' : 'PDF'}
              </button>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
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
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Toolbar: edit / delete — share & PDF live on the banner. */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-border/60 pb-6">
              <button onClick={() => setEditing(true)} disabled={busy} className={toolbarClass}>
                <Pencil size={18} aria-hidden="true" />
                Edit
              </button>
              <button onClick={handleDelete} disabled={busy} className={toolbarClass}>
                <Trash2 size={18} aria-hidden="true" />
                Delete
              </button>
            </div>

            {trip.interests.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-1.5">
                {trip.interests.map((interest) => (
                  <Badge key={interest} color="slate">
                    {interest}
                  </Badge>
                ))}
              </div>
            )}

            {/* Budget summary — updates live after any regeneration */}
            <section className="mt-8">
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

              {/* Metric cards — muted 13px label, 24px/500 number. */}
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
                    }`}                    >
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
                    {remaining != null ? formatCurrency(remaining, trip.currency) : '—'}
                  </div>
                </div>
              </div>

              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    over
                      ? 'bg-gradient-to-r from-error to-error/80'
                      : 'bg-gradient-to-r from-primary to-accent'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {trip.cost && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {Object.entries(trip.cost.breakdown)
                    .filter(([, value]) => value > 0)
                    .map(([category, value]) => (
                      <Badge key={category} color="slate" className="capitalize">
                        {category} · {formatCurrency(value, trip.currency)}
                      </Badge>
                    ))}
                </div>
              )}
            </section>

            {/* Interactive map */}
            {mapItems.some((i) => i.latitude != null && i.longitude != null) && (
              <section className="mt-10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-text">
                    Map
                  </h2>
                  {mappedItemCount < mapItems.length && (
                    <span className="text-xs text-muted">
                      {mapItems.length - mappedItemCount} place
                      {mapItems.length - mappedItemCount === 1 ? '' : 's'} without coordinates
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted">
                  Click a pin or a place below to find it on the other side.
                </p>
                <MapView
                  className="mt-4"
                  items={mapItems}
                  highlightedId={highlightedItemId}
                  onSelectItem={handleMarkerSelect}
                  currency={trip.currency}
                />
              </section>
            )}

            {/* Itinerary */}
            <section className="mt-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-text">
                    Itinerary
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    {trip.days.length} day{trip.days.length === 1 ? '' : 's'} planned
                  </p>
                </div>
                <button
                  onClick={() => setShowAddDay((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-xl btn-primary-bg px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200  hover:shadow-primary/40 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  <CalendarPlus size={16} aria-hidden="true" />
                  Add day
                </button>
              </div>

              {showAddDay && (
                <form
                  onSubmit={handleAddDay}
                  className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border border-border/60 bg-background/40 p-5"
                >
                  <div className="w-56">
                    <DatePicker
                      id="newDayDate"
                      label="Date"
                      value={newDayDate}
                      onChange={setNewDayDate}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy || !newDayDate}
                    className="rounded-xl btn-primary-bg px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200  hover:shadow-primary/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                  >
                    {busy ? 'Adding…' : 'Add day'}
                  </button>
                </form>
              )}

              {trip.days.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-border/70 bg-background/30 px-8 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CalendarPlus size={22} aria-hidden="true" />
                  </div>
                  <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted">
                    No itinerary yet. Add a day to start sketching your trip, or wait for AI
                    planning to do it for you.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-6">
                  {trip.days.map((day) => (
                    <div
                      key={day.id}
                      className="overflow-hidden rounded-2xl border border-border/60 bg-background/20"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-surface px-5 py-4">
                        <h3 className="font-display text-xl font-normal tracking-tight text-text">
                          Day {day.dayNumber}
                          <span className="ml-2 font-sans text-sm font-medium tracking-normal text-muted">
                            {formatDate(day.date)}
                          </span>
                        </h3>
                        <div className="flex flex-wrap items-center gap-4">
                          {regeneratingDay === day.dayNumber ? (
                            <span className="flex items-center gap-2 text-sm font-medium text-primary">
                              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                              Re-planning…
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setRegenerateInstruction('')
                                setRegenerateDayNumber(day.dayNumber)
                              }}
                              disabled={busy || regeneratingDay != null}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted transition-colors duration-200 hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50"
                            >
                              <Sparkles size={15} aria-hidden="true" />
                              Regenerate
                            </button>
                          )}
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
                            disabled={busy || regeneratingDay != null}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors duration-200 hover:text-primary/80 disabled:opacity-50"
                          >
                            {itemFormFor === day.id ? (
                              <>
                                <X size={15} aria-hidden="true" />
                                Cancel
                              </>
                            ) : (
                              <>
                                <Plus size={15} aria-hidden="true" />
                                Add place
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteDay(day.id)}
                            disabled={busy || regeneratingDay === day.dayNumber}
                            className="text-sm font-medium text-error transition-colors duration-200 hover:text-error/80 disabled:opacity-50"
                          >
                            Delete day
                          </button>
                        </div>
                      </div>

                      {itemFormFor === day.id && (
                        <form
                          onSubmit={(e) => handleAddItem(e, day.id)}
                          className="grid gap-3 border-b border-border/60 bg-primary/5 p-5 sm:grid-cols-2"
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
                              placeholder={`Cost (${trip.currency})`}
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
                            className="rounded-xl btn-primary-bg px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200  hover:shadow-primary/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:col-span-2"
                          >
                            {busy ? 'Adding…' : 'Add place'}
                          </button>
                        </form>
                      )}

                      {day.items.length === 0 ? (
                        <p className="px-5 py-5 text-sm text-muted">No places planned for this day.</p>
                      ) : (
                        <ol className="divide-y divide-border/60">
                          {day.items.map((item) => (
                            <li
                              key={item.id}
                              id={`trip-item-${item.id}`}
                              onMouseEnter={() => handleItemHover(item.id)}
                              onMouseLeave={() => handleItemHover(null)}
                              onClick={() => handleMarkerSelect(item.id)}
                              className={`flex cursor-pointer items-start gap-4 px-5 py-4 transition-colors duration-200 ${
                                selectedItemId === item.id
                                  ? 'bg-primary/10 ring-1 ring-inset ring-primary/30'
                                  : highlightedItemId === item.id
                                    ? 'bg-primary/5'
                                    : 'hover:bg-surface-hover/60'
                              }`}
                            >
                              {/* Place thumbnail — Places photo when available,
                                  else the Unsplash fallback pattern. */}
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
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin size={12} aria-hidden="true" />
                                    {item.latitude == null || item.longitude == null
                                      ? 'no map pin'
                                      : 'on map'}
                                  </span>
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
                              <button
                                onClick={() => handleDeleteItem(day.id, item.id)}
                                disabled={busy}
                                className="shrink-0 rounded-lg p-1.5 text-muted transition-colors duration-200 hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40 disabled:opacity-50"
                                aria-label={`Delete ${item.placeName}`}
                              >
                                <X size={16} aria-hidden="true" />
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
        </div>
      )}

      {/* Share link modal */}
      <Modal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Share this trip"
        footer={
          <button
            type="button"
            onClick={handleCopyShareLink}
            className="rounded-xl btn-primary-bg px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200  hover:shadow-primary/40 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            {shareCopied ? 'Copied ✓' : 'Copy link'}
          </button>
        }
      >
        <p className="text-sm leading-relaxed text-muted">
          Anyone with this link can view the trip read-only — no sign-in needed.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-background/60 p-2.5">
          <input
            id="share-url-input"
            readOnly
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full bg-transparent text-sm text-text focus:outline-none"
          />
        </div>
        <p className="mt-3 text-xs text-muted">
          Opens at /shared/trips/&lt;token&gt; — the same page works for signed-in and signed-out
          visitors.
        </p>
      </Modal>

      {/* Regenerate-day modal */}
      <Modal
        open={regenerateDayNumber != null}
        onClose={() => setRegenerateDayNumber(null)}
        title={regenerateDayNumber != null ? `Regenerate Day ${regenerateDayNumber}` : ''}
        footer={
          <>
            <button
              type="button"
              onClick={() => setRegenerateDayNumber(null)}
              disabled={regeneratingDay != null}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-text transition-colors duration-200 hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="regenerate-form"
              disabled={!regenerateInstruction.trim() || regeneratingDay != null}
              className="inline-flex items-center gap-2 rounded-xl btn-primary-bg px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200  hover:shadow-primary/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <Sparkles size={15} aria-hidden="true" />
              {regeneratingDay === regenerateDayNumber ? 'Regenerating…' : 'Regenerate day'}
            </button>
          </>
        }
      >
        <form id="regenerate-form" onSubmit={handleRegenerate}>
          <p className="text-sm leading-relaxed text-muted">
            Tell Gemini how to re-plan this day — the rest of your itinerary stays exactly as it is.
          </p>
          <textarea
            value={regenerateInstruction}
            onChange={(e) => setRegenerateInstruction(e.target.value)}
            placeholder="e.g. Focus on food, skip crowded tourist spots, start late in the morning"
            rows={3}
            maxLength={500}
            autoFocus
            className="input mt-4 resize-none py-3"
          />
        </form>
      </Modal>
    </main>
  )
}
