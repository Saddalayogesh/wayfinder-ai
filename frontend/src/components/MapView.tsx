import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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
  className?: string
}

const PIN_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

function pinColor(dayNumber: number | null | undefined): string {
  if (dayNumber == null) return PIN_COLORS[0]
  return PIN_COLORS[(dayNumber - 1) % PIN_COLORS.length]
}

function createIcon(item: MapItem): L.DivIcon {
  const color = pinColor(item.dayNumber)
  const label = item.dayNumber != null ? String(item.dayNumber) : ''
  return L.divIcon({
    className: 'trip-marker',
    html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);color:#fff;font-weight:700;font-size:11px;font-family:ui-sans-serif,system-ui,sans-serif">${label}</span></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  })
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function popupHtml(item: MapItem): string {
  const parts: string[] = []
  parts.push(
    `<div style="font-weight:700;font-size:13px;font-family:ui-sans-serif,system-ui,sans-serif">${escapeHtml(item.name)}</div>`,
  )
  if (item.photoUrl) {
    parts.push(
      `<img src="${escapeHtml(item.photoUrl)}" alt="" style="width:100%;max-width:220px;border-radius:6px;margin-top:4px" loading="lazy" />`,
    )
  }
  if (item.rating != null) {
    parts.push(`<div style="color:#b45309;font-size:12px">★ ${Number(item.rating).toFixed(1)}</div>`)
  }
  if (item.description) {
    parts.push(`<div style="color:#64748b;font-size:12px;margin-top:2px">${escapeHtml(item.description)}</div>`)
  }
  const meta: string[] = []
  if (item.dayNumber != null) meta.push(`Day ${item.dayNumber}`)
  if (item.estimatedCost != null) {
    meta.push(
      new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(item.estimatedCost),
    )
  }
  if (item.visitDuration != null) meta.push(`${item.visitDuration}m`)
  if (meta.length > 0) {
    parts.push(`<div style="color:#94a3b8;font-size:11px;margin-top:2px">${meta.join(' · ')}</div>`)
  }
  return parts.join('')
}

/**
 * Interactive map for itinerary items using Leaflet + OpenStreetMap tiles.
 * Items without coordinates are skipped gracefully — they simply get no marker.
 */
export default function MapView({ items, highlightedId, onSelectItem, className }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<number, L.Marker>>(new Map())
  const onSelectRef = useRef(onSelectItem)
  const highlightRef = useRef<number | null>(highlightedId)
  onSelectRef.current = onSelectItem
  highlightRef.current = highlightedId

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current).setView([20, 0], 2)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current.clear()
    }
  }, [])

  // Rebuild markers whenever the items change.
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
        .bindPopup(popupHtml(item))
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
  }, [items])

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
      className={`z-0 overflow-hidden rounded-xl border border-slate-200 ${className ?? ''}`}
      style={{ height: '100%', minHeight: 340 }}
      aria-label="Map of itinerary places"
    />
  )
}
