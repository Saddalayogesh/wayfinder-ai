import api from './api'

// --- Types (mirror the backend TripResponse / request DTOs) ------------------

export interface ItineraryItem {
  id: number
  placeName: string
  description: string | null
  latitude: number | null
  longitude: number | null
  estimatedCost: number | null
  visitDuration: number | null
  sequenceOrder: number
}

export interface TripDay {
  id: number
  dayNumber: number
  date: string
  items: ItineraryItem[]
}

export interface Trip {
  id: number
  title: string
  destination: string
  startDate: string
  endDate: string
  travelers: number
  budget: number
  travelStyle: string
  interests: string[]
  days: TripDay[]
  createdAt: string
  updatedAt: string
}

export interface ItineraryItemInput {
  placeName: string
  description?: string
  latitude?: number
  longitude?: number
  estimatedCost?: number
  visitDuration?: number
  sequenceOrder?: number
}

export interface TripDayInput {
  dayNumber?: number
  date: string
  items?: ItineraryItemInput[]
}

export interface TripInput {
  title: string
  destination: string
  startDate: string
  endDate: string
  travelers: number
  budget: number
  travelStyle: string
  interests?: string[]
  days?: TripDayInput[]
}

export const TRAVEL_STYLES = [
  'ADVENTURE',
  'RELAXED',
  'CULTURAL',
  'FAMILY',
  'LUXURY',
  'CITY_BREAK',
  'BEACH',
  'ROAD_TRIP',
] as const

export const TRAVEL_INTERESTS = [
  'Food',
  'Culture',
  'Nature',
  'Adventure',
  'History',
  'Shopping',
  'Nightlife',
  'Beach',
  'Museums',
  'Hiking',
  'Photography',
  'Local life',
  'Wellness',
  'Sports',
] as const

// --- API calls -----------------------------------------------------------------

export async function createTrip(input: TripInput): Promise<Trip> {
  const { data } = await api.post<Trip>('/trips', input)
  return data
}

export async function getTrips(): Promise<Trip[]> {
  const { data } = await api.get<Trip[]>('/trips')
  return data
}

export async function getTrip(id: number | string): Promise<Trip> {
  const { data } = await api.get<Trip>(`/trips/${id}`)
  return data
}

export async function updateTrip(id: number | string, input: TripInput): Promise<Trip> {
  const { data } = await api.put<Trip>(`/trips/${id}`, input)
  return data
}

export async function deleteTrip(id: number | string): Promise<void> {
  await api.delete(`/trips/${id}`)
}

// Itinerary management (each returns the refreshed trip)

export async function addDay(tripId: number | string, input: TripDayInput): Promise<Trip> {
  const { data } = await api.post<Trip>(`/trips/${tripId}/days`, input)
  return data
}

export async function addItem(
  tripId: number | string,
  dayId: number,
  input: ItineraryItemInput,
): Promise<Trip> {
  const { data } = await api.post<Trip>(`/trips/${tripId}/days/${dayId}/items`, input)
  return data
}

export async function deleteDay(tripId: number | string, dayId: number): Promise<Trip> {
  const { data } = await api.delete<Trip>(`/trips/${tripId}/days/${dayId}`)
  return data
}

export async function deleteItem(
  tripId: number | string,
  dayId: number,
  itemId: number,
): Promise<Trip> {
  const { data } = await api.delete<Trip>(`/trips/${tripId}/days/${dayId}/items/${itemId}`)
  return data
}

// --- Display helpers -------------------------------------------------------------

/** Formats an ISO date (YYYY-MM-DD) without timezone shifts. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Formats a budget value as USD-style currency. */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)
}
