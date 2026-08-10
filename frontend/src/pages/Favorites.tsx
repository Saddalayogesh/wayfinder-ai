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
import Skeleton from '../components/common/Skeleton'

type LoadState = 'loading' | 'ready' | 'error'

function FavoritesSkeleton() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-5">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
          <Skeleton className="mt-4 h-9 w-24 rounded-lg" />
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
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Favorites</h1>
          <p className="mt-1 text-sm text-slate-500">
            Places you've saved for future trips.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          {error}
        </div>
      )}

      {/* Search + add */}
      <form onSubmit={handleSearch} className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a place to save — e.g. Eiffel Tower Paris"
            aria-label="Search places"
            autoComplete="off"
          />
        </div>
        <Button type="submit" loading={searching} disabled={!query.trim()}>
          Search
        </Button>
      </form>

      {searchError && (
        <p role="alert" className="mt-3 text-sm text-rose-600">
          {searchError}
        </p>
      )}

      {searchResults !== null && (
        <section className="mt-4 space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Search results
          </h2>
          {searchResults.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              No places found for “{query}”. Try a different name or city.
            </p>
          ) : (
            searchResults.map((place) => (
              <Card key={place.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{place.name}</p>
                  {place.address && (
                    <p className="mt-0.5 truncate text-xs text-slate-500">{place.address}</p>
                  )}
                </div>
                {savedPlaceIds.has(place.id) ? (
                  <Badge color="emerald">Saved</Badge>
                ) : (
                  <Button
                    size="sm"
                    loading={savingId === place.id}
                    disabled={savingId != null}
                    onClick={() => handleSave(place)}
                  >
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
        <div className="mt-12 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="text-4xl" aria-hidden="true">
            ⭐
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">No favorites yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Search for a place above and save it — your favorite spots will live here.
          </p>
        </div>
      )}

      {state === 'ready' && favorites.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Saved places ({favorites.length})
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((favorite) => (
              <Card
                key={favorite.id}
                className="flex items-center justify-between gap-3 p-5 hover:shadow-raised"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {favorite.placeName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    Saved {new Date(favorite.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  loading={removingId === favorite.id}
                  disabled={removingId != null}
                  onClick={() => handleRemove(favorite)}
                >
                  Remove
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
