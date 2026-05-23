// =============================================================================
// GiriGo — Google Maps Integration Layer
// =============================================================================

import type { GeocodeResult, DistanceResult } from '@/types'

const GMAPS_KEY = process.env.GOOGLE_MAPS_API_KEY!

// ── Haversine distance (fallback when Maps API unavailable) ───────────────────
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R    = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Geocoding: address → lat/lng ─────────────────────────────────────────────
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  if (!GMAPS_KEY) throw new Error('GOOGLE_MAPS_API_KEY not configured')

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', `${address}, Gerung, Lombok Barat, NTB, Indonesia`)
  url.searchParams.set('key', GMAPS_KEY)
  url.searchParams.set('language', 'id')
  url.searchParams.set('region', 'id')

  const res  = await fetch(url.toString(), { next: { revalidate: 3600 } })
  const data = await res.json()

  if (data.status !== 'OK' || !data.results?.length) {
    throw new Error(`Geocoding failed: ${data.status} for "${address}"`)
  }

  const result   = data.results[0]
  const location = result.geometry.location

  return {
    address:      address,
    lat:          location.lat,
    lng:          location.lng,
    display_name: result.formatted_address,
  }
}

// ── Distance Matrix: road distance + duration ─────────────────────────────────
export async function getRouteDistance(
  originLat: number, originLng: number,
  destLat:   number, destLng:   number
): Promise<DistanceResult> {
  if (!GMAPS_KEY) {
    // Fallback: use haversine + 1.25x road factor estimate
    const straight = haversineKm(originLat, originLng, destLat, destLng)
    const roadKm   = Math.round(straight * 1.25 * 100) / 100
    return {
      distance_km:  roadKm,
      duration_min: Math.round(roadKm * 4),  // ~15 km/h avg in sub-district
      nav_link:     generateNavLink(destLat, destLng),
    }
  }

  const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json')
  url.searchParams.set('origins',      `${originLat},${originLng}`)
  url.searchParams.set('destinations', `${destLat},${destLng}`)
  url.searchParams.set('key',          GMAPS_KEY)
  url.searchParams.set('mode',         'driving')
  url.searchParams.set('language',     'id')

  const res  = await fetch(url.toString())
  const data = await res.json()

  if (data.status !== 'OK') {
    throw new Error(`Distance Matrix failed: ${data.status}`)
  }

  const element = data.rows[0]?.elements[0]
  if (element?.status !== 'OK') {
    throw new Error(`Route not found between coordinates`)
  }

  return {
    distance_km:  Math.round((element.distance.value / 1000) * 100) / 100,
    duration_min: Math.round(element.duration.value / 60),
    nav_link:     generateNavLink(destLat, destLng),
  }
}

// ── Navigation deep link ──────────────────────────────────────────────────────
export function generateNavLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

export function generateNavLinkWithOrigin(
  originLat: number, originLng: number,
  destLat:   number, destLng:   number
): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}`
}

// ── Parse "lat,lng" string ────────────────────────────────────────────────────
export function parseGeo(geoString: string): { lat: number; lng: number } | null {
  const parts = geoString.split(',').map(Number)
  if (parts.length !== 2 || parts.some(isNaN)) return null
  const [lat, lng] = parts
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { lat, lng }
}
