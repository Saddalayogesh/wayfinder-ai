import api from './api'

export interface Favorite {
  id: number
  placeId: string
  placeName: string
  createdAt: string
}

export interface FavoriteInput {
  placeId: string
  placeName: string
}

export async function getFavorites(): Promise<Favorite[]> {
  const { data } = await api.get<Favorite[]>('/favorites')
  return data
}

export async function addFavorite(input: FavoriteInput): Promise<Favorite> {
  const { data } = await api.post<Favorite>('/favorites', input)
  return data
}

export async function removeFavorite(favoriteId: number): Promise<void> {
  await api.delete(`/favorites/${favoriteId}`)
}
