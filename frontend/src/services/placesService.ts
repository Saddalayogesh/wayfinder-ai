import api from './api'

export interface PlaceResult {
  id: string
  name: string
  latitude: number | null
  longitude: number | null
  address: string | null
  rating: number | null
  photoUrl: string | null
}

export async function searchPlaces(destination: string, limit = 5): Promise<PlaceResult[]> {
  const { data } = await api.get<PlaceResult[]>('/places/search', {
    params: { destination, limit },
  })
  return data
}
