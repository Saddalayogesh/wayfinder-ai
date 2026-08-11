import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTheme, type Theme } from '../context/ThemeContext'

/** An item the map can pin. Items without latitude/longitude are skipped. */
export interface MapItem {
  id: number
  name: string
  latitude: number | null
  longitude: number | null
  dayNumber?: number | null
  description?: string | null
  estimatedCost?: number | null
  visitDuration?: number | null
  /** Optional enrichment fields — rendered only when present. */
  rating?: number | null
  photoUrl?: string | null
}

interface MapViewProps {
  items: MapItem[]
  /** Item id whose marker should be opened/panned to (null clears). */
  highlightedId: number | null
  /** Called when a marker is clicked. */
  onSelectItem: (id: number) => void
  /** ISO-4217 currency code for cost popups (defaults to USD). */
  currency?: string
  className?: string
}

/**
 * Day-pin palette — mirrors the --pin-* CSS variables in index.css, which are
 * derived from the primary/accent design tokens (no extra hex values).
 */
const PIN_COLORS = ['var(--pin-1)', 'var(--pin-2)', 'var(--pin-3)', 'var(--pin-4)', 'var(--pin-5)', 'var(--pin-6)']

function pinColor(dayNumber: number | null | undefined): string {
  if (dayNumber == null) return PIN_COLORS[0]
  return PIN_COLORS[(dayNumber - 1) % PIN_COLORS.length]
}

function createIcon(item: MapItem): L.DivIcon {
  const color = pinColor(item.dayNumber)
  const label = item.dayNumber != null ? String(item.dayNumber) : ''
  return L.divIcon({
    className: 'trip-marker',
    html: `<div class="trip-pin" style="background:${color}"><span>${label}</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  })
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function popupHtml(item: MapItem, currency: string): string {
  const parts: string[] = ['<div class="trip-popup">']
  parts.push(`<div class="trip-popup__name">${escapeHtml(item.name)}</div>`)
  if (item.photoUrl) {
    parts.push(
      `<img src="${escapeHtml(item.photoUrl)}" alt="" class="trip-popup__thumb" loading="lazy" />`,
    )
  }
  if (item.rating != null) {
    parts.push(`<div class="trip-popup__rating">★ ${Number(item.rating).toFixed(1)}</div>`)
  }
  if (item.description) {
    parts.push(`<div class="trip-popup__desc">${escapeHtml(item.description)}</div>`)
  }
  const meta: string[] = []
  if (item.dayNumber != null) meta.push(`Day ${item.dayNumber}`)
  if (item.estimatedCost != null) {
    meta.push(
      new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(item.estimatedCost),
    )
  }
  if (item.visitDuration != null) meta.push(`${item.visitDuration}m`)
  if (meta.length > 0) {
    parts.push(`<div class="trip-popup__meta">${meta.join(' · ')}</div>`)
  }
  parts.push('</div>')
  return parts.join('')
}

/** CARTO basemap per theme — dark tiles at night, light tiles for light mode. */
function tileUrl(theme: Theme): string {
  return theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
}

/**
 * Interactive map for itinerary items using Leaflet + CARTO tiles (dark or
 * light to match the active theme). Items without coordinates are skipped
 * gracefully — they simply get no marker.
 */
export default function MapView({
  items,
  highlightedId,
  onSelectItem,
  currency = 'USD',
  className,
}: MapViewProps) {
  const { theme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<number, L.Marker>>(new Map())
  const onSelectRef = useRef(onSelectItem)
  const highlightRef = useRef<number | null>(highlightedId)
  onSelectRef.current = onSelectItem
  highlightRef.current = highlightedId

  // Create the map once (tile layer is added below so it can follow theme).
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current).setView([20, 0], 2)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current.clear()
    }
  }, [])

  // Tile layer follows the theme — swap the basemap whenever it flips.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) layer.remove()
    })
    L.tileLayer(tileUrl(theme), {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map)
  }, [theme])

  // Rebuild markers whenever the items or currency change.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) layer.remove()
    })
    markersRef.current.clear()

    const bounds: L.LatLngExpression[] = []
    items.forEach((item) => {
      if (item.latitude == null || item.longitude == null) return // skip, don't crash
      const latlng: L.LatLngExpression = [item.latitude, item.longitude]
      bounds.push(latlng)
      const marker = L.marker(latlng, { icon: createIcon(item) })
        .bindPopup(popupHtml(item, currency), { closeButton: true, minWidth: 232, maxWidth: 232 })
        .on('click', () => onSelectRef.current(item.id))
      marker.addTo(map)
      markersRef.current.set(item.id, marker)
    })

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds).pad(0.35))
    } else {
      map.setView([20, 0], 2)
    }

    // Re-apply the active highlight after a rebuild (e.g. item deleted/added
    // while a highlight was active) so the popup doesn't silently disappear.
    const active = highlightRef.current
    if (active != null) {
      const marker = markersRef.current.get(active)
      if (marker) {
        marker.openPopup()
        map.panTo(marker.getLatLng())
      }
    }
  }, [items, currency])

  // Open/pan to the highlighted marker; close others.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    markersRef.current.forEach((marker, id) => {
      if (id === highlightedId) {
        marker.openPopup()
        map.panTo(marker.getLatLng())
      } else {
        marker.closePopup()
      }
    })
  }, [highlightedId])

  return (
    <div
      ref={containerRef}
      className={`relative z-0 overflow-hidden rounded-2xl border border-border/70 ${className ?? ''}`}
      style={{ height: '100%', minHeight: 360 }}
      aria-label="Map of itinerary places"
    />
  )
}
