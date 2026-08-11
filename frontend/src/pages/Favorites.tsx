import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { getErrorMessage } from '../services/api'
import {
  addFavorite,
  getFavorites,
  removeFavorite,
  type Favorite,
} from '../services/favoritesService'
import { searchPlaces, type PlaceResult } from '../services/placesService'
import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import ErrorState from '../components/common/ErrorState'
import Input from '../components/common/Input'
import ResponsiveImg from '../components/common/ResponsiveImg'
import Skeleton from '../components/common/Skeleton'
import TripCover from '../components/common/TripCover'
import { Heart, MapPin, Plus, Search, Star, Trash2 } from 'lucide-react'

type LoadState = 'loading' | 'ready' | 'error'

function FavoritesSkeleton() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="mt-2 h-4 w-1/2" />
            </div>
          </div>
          <Skeleton className="mt-4 h-9 w-24 rounded-xl" />
        </Card>
      ))}
    </div>
  )
}

export default function Favorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)

  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<PlaceResult[] | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setState('loading')
    setError(null)
    try {
      setFavorites(await getFavorites())
      setState('ready')
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your favorites.'))
      setState('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setSearchError(null)
    setSearchResults(null)
    try {
      setSearchResults(await searchPlaces(query.trim()))
    } catch (err) {
      setSearchError(getErrorMessage(err, 'Could not search places.'))
    } finally {
      setSearching(false)
    }
  }

  const handleSave = async (place: PlaceResult) => {
    setSavingId(place.id)
    try {
      await addFavorite({ placeId: place.id, placeName: place.name })
      setSearchResults((current) => current?.filter((p) => p.id !== place.id) ?? null)
      setFavorites(await getFavorites())
    } catch (err) {
      setSearchError(getErrorMessage(err, 'Could not save this place.'))
    } finally {
      setSavingId(null)
    }
  }

  const handleRemove = async (favorite: Favorite) => {
    setRemovingId(favorite.id)
    try {
      await removeFavorite(favorite.id)
      setFavorites((current) => current.filter((f) => f.id !== favorite.id))
    } catch (err) {
      setError(getErrorMessage(err, 'Could not remove this favorite.'))
    } finally {
      setRemovingId(null)
    }
  }

  const savedPlaceIds = new Set(favorites.map((f) => f.placeId))

  return (
    <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
          Your collection
        </p>
        <h1 className="mt-3 font-display text-4xl font-normal tracking-tight text-text sm:text-5xl">
          Favorites
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          Places you've saved for future trips.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-8 rounded-xl border border-error/25 bg-error/10 px-4 py-3 text-sm text-error"
        >
          {error}
        </div>
      )}

      {/* Search + add */}
      <form onSubmit={handleSearch} className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            id="favorites-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a place to save — e.g. Eiffel Tower Paris"
            aria-label="Search places"
            autoComplete="off"
            className="pl-10"
          />
        </div>
        <Button type="submit" loading={searching} disabled={!query.trim()}>
          Search
        </Button>
      </form>

      {searchError && (
        <p role="alert" className="mt-3 text-sm text-error">
          {searchError}
        </p>
      )}

      {searchResults !== null && (
        <section className="mt-8 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">
            Search results
          </h2>
          {searchResults.length === 0 ? (
            <div className="rounded-xl border border-border/70 bg-surface px-5 py-6 text-sm text-muted">
              No places found for “{query}”. Try a different name or city.
            </div>
          ) : (
            searchResults.map((place) => (
              <Card
                key={place.id}
                className="flex items-center justify-between gap-4 p-4 transition-colors duration-200"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <TripCover
                    label={place.name}
                    src={place.photoUrl}
                    scrim={false}
                    className="h-12 w-12 shrink-0 rounded-xl"
                  />
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm font-semibold text-text">
                      {place.name}
                      {place.rating != null && (
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs text-accent">
                          <Star size={12} aria-hidden="true" />
                          {Number(place.rating).toFixed(1)}
                        </span>
                      )}
                    </p>
                    {place.address && (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
                        <MapPin size={12} aria-hidden="true" className="shrink-0" />
                        {place.address}
                      </p>
                    )}
                  </div>
                </div>
                {savedPlaceIds.has(place.id) ? (
                  <Badge color="accent" className="shrink-0">
                    Saved
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    loading={savingId === place.id}
                    disabled={savingId != null}
                    onClick={() => handleSave(place)}
                    className="shrink-0"
                  >
                    <Plus size={14} aria-hidden="true" />
                    Save
                  </Button>
                )}
              </Card>
            ))
          )}
        </section>
      )}

      {state === 'loading' && <FavoritesSkeleton />}

      {state === 'error' && (
        <div className="mt-8">
          <ErrorState message={error ?? ''} onRetry={load} />
        </div>
      )}

      {state === 'ready' && favorites.length === 0 && (
        <div className="relative mt-14 overflow-hidden rounded-2xl border border-border/70 bg-surface px-8 py-20 text-center">
          {/* Muted photography behind the empty state, not just an icon. */}
          <ResponsiveImg
            src="/images/empty-favorites.jpg"
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
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Heart size={26} aria-hidden="true" />
            </div>
            <h2 className="mt-6 font-display text-3xl font-normal tracking-tight text-text">
              No favorites yet
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
              Search for a place above and save it — your favorite spots will live here.
            </p>
            <button
              type="button"
              onClick={() => document.getElementById('favorites-search')?.focus()}
              className="mt-8 inline-flex items-center gap-2 rounded-xl border border-border px-6 py-2.5 text-sm font-semibold text-text transition-all duration-200 hover:border-primary/40 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <Search size={16} aria-hidden="true" />
              Search for a place
            </button>
          </div>
        </div>
      )}

      {state === 'ready' && favorites.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">
            Saved places ({favorites.length})
          </h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((favorite) => (
              <Card
                key={favorite.id}
                className="group relative overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
              >
                <TripCover
                  label={favorite.placeName}
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                  imgClassName="transition-transform duration-500 group-hover:scale-105"
                  className="h-40 w-full"
                />
                {/* Remove — revealed on hover, keyboard-focusable. */}
                <button
                  onClick={() => handleRemove(favorite)}
                  disabled={removingId != null}
                  className="absolute right-3 top-3 rounded-lg border border-border bg-background/70 p-2 text-muted backdrop-blur transition-all duration-200 hover:border-error/60 hover:text-error focus-visible:opacity-100 disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label={`Remove ${favorite.placeName}`}
                >
                  {removingId === favorite.id ? (
                    <span className="block h-4 w-4 animate-spin rounded-full border-2 border-error/30 border-t-error" />
                  ) : (
                    <Trash2 size={15} aria-hidden="true" />
                  )}
                </button>
                <div className="p-5">
                  <p className="truncate font-display text-lg font-normal tracking-tight text-text">
                    {favorite.placeName}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted">
                    Saved {new Date(favorite.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
