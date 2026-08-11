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
  /** Optional enrichment (e.g. from Google Places) — rendered when present. */
  rating?: number | null
  photoUrl?: string | null
}

export interface TripDay {
  id: number
  dayNumber: number
  date: string
  items: ItineraryItem[]
}

export interface CostBreakdown {
  estimatedTotal: number
  remaining: number | null
  breakdown: {
    accommodation: number
    food: number
    activities: number
    transport: number
  }
}

export interface Trip {
  id: number
  title: string
  destination: string
  startDate: string
  endDate: string
  travelers: number
  budget: number
  /** ISO-4217 currency code for all costs (defaults to USD). */
  currency: string
  travelStyle: string
  interests: string[]
  days: TripDay[]
  cost: CostBreakdown
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
  /** ISO-4217 currency code for costs and the budget (defaults to USD). */
  currency: string
  travelStyle: string
  interests?: string[]
  days?: TripDayInput[]
}

/** Currencies offered in the trip form (symbols are display hints; Intl formats precisely). */
export const CURRENCIES = [
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', label: 'Swiss Franc', symbol: 'Fr' },
  { code: 'AED', label: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SGD', label: 'Singapore Dollar', symbol: 'S$' },
  { code: 'THB', label: 'Thai Baht', symbol: '฿' },
  { code: 'MXN', label: 'Mexican Peso', symbol: 'MX$' },
  { code: 'BRL', label: 'Brazilian Real', symbol: 'R$' },
  { code: 'ZAR', label: 'South African Rand', symbol: 'R' },
  { code: 'KRW', label: 'South Korean Won', symbol: '₩' },
  { code: 'CNY', label: 'Chinese Yuan', symbol: '¥' },
] as const

export function currencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? ''
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

/** Calls POST /api/trips/generate — Gemini builds the itinerary, backend persists it. */
export async function generateTrip(input: TripInput): Promise<Trip> {
  const { data } = await api.post<Trip>('/trips/generate', {
    destination: input.destination,
    startDate: input.startDate,
    endDate: input.endDate,
    travelers: input.travelers,
    budget: input.budget,
    currency: input.currency,
    travelStyle: input.travelStyle,
    interests: input.interests ?? [],
  })
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

/** Calls POST /api/trips/{id}/days/{dayNumber}/regenerate — Gemini re-plans one day. */
export async function regenerateDay(
  tripId: number | string,
  dayNumber: number,
  instruction: string,
): Promise<Trip> {
  const { data } = await api.post<Trip>(`/trips/${tripId}/days/${dayNumber}/regenerate`, {
    instruction,
  })
  return data
}

// --- Sharing + PDF export ----------------------------------------------------

export interface ShareResponse {
  token: string
  shareUrl: string
}

/** Calls POST /api/trips/{id}/share — returns the public read-only token + URL. */
export async function shareTrip(tripId: number | string): Promise<ShareResponse> {
  const { data } = await api.post<ShareResponse>(`/trips/${tripId}/share`)
  return data
}

/** Calls the public GET /api/shared/trips/{token} — no JWT needed. */
export async function getSharedTrip(token: string): Promise<Trip> {
  const { data } = await api.get<Trip>(`/shared/trips/${token}`)
  return data
}

/** Downloads the owner-only PDF export as a Blob for the browser to save. */
export async function downloadTripPdf(tripId: number | string): Promise<Blob> {
  const { data } = await api.get<Blob>(`/trips/${tripId}/export/pdf`, {
    responseType: 'blob',
  })
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

/** Formats a value as currency, defaulting to USD. */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)
}
