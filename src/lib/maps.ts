// =============================================================================
// GiriGo — Google Maps Integration Layer (Server-Side)
// =============================================================================

import type { GeocodeResult, DistanceResult } from '@/types'

// ── Rate-limit token bucket for Google APIs ──────────────────────────────────
const API_CALL_LIMIT = new Map<string, number>()
const API_CALL_WINDOW_MS = 1000 // 1 req/sec per endpoint to avoid quota issues

function checkApiRateLimit(endpoint: string): void {
  const lastCall = API_CALL_LIMIT.get(endpoint) ?? 0
  const now = Date.now()
  const elapsed = now - lastCall

  if (elapsed < API_CALL_WINDOW_MS) {
    throw new Error(`GiriGo: Google API rate limit hit on ${endpoint}. Retry later.`)
  }

  API_CALL_LIMIT.set(endpoint, now)
}

// ── Resolve API key ──────────────────────────────────────────────────────────
function getApiKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY

  if (!key || key === 'your-google-maps-api-key' || key.startsWith('placeholder')) {
    throw new Error(
      'GOOGLE_MAPS_API_KEY tidak dikonfigurasi. Hubungi admin untuk mengaktifkan layanan peta.'
    )
  }

  return key
}

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
  const GMAPS_KEY = getApiKey()

  checkApiRateLimit('geocode')

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', `${address}, Gerung, Lombok Barat, NTB, Indonesia`)
  url.searchParams.set('key', GMAPS_KEY)
  url.searchParams.set('language', 'id')
  url.searchParams.set('region', 'id')

  let res: Response
  try {
    res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    })
  } catch (fetchErr: any) {
    throw new Error(`Gagal menghubungi Google Geocoding API: ${fetchErr.message}`)
  }

  if (!res.ok) {
    throw new Error(`Google Geocoding API error: HTTP ${res.status}`)
  }

  const data = await res.json()

  if (data.status !== 'OK' || !data.results?.length) {
    const reason = data.error_message ?? data.status ?? 'UNKNOWN'
    console.warn(`[GiriGo Maps] Geocoding "${address}" failed: ${reason}`)

    const messages: Record<string, string> = {
      'ZERO_RESULTS': `Alamat "${address}" tidak ditemukan. Coba gunakan nama zona atau alamat yang lebih spesifik.`,
      'OVER_DAILY_LIMIT': 'Batas harian Google Maps API tercapai. Silakan gunakan pilihan zona.',
      'OVER_QUERY_LIMIT': 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
      'REQUEST_DENIED': 'Google Maps API ditolak. Periksa konfigurasi API key.',
      'INVALID_REQUEST': `Format alamat tidak valid: "${address}"`,
      'UNKNOWN_ERROR': 'Google Maps API mengalami kesalahan. Silakan coba lagi.',
    }

    throw new Error(messages[reason] ?? `Geocoding gagal (${reason}) untuk "${address}"`)
  }

  const result   = data.results[0]
  const location = result.geometry?.location

  if (!location?.lat || !location?.lng) {
    throw new Error(`Hasil geocoding tidak memiliki koordinat untuk "${address}"`)
  }

  return {
    address: address,
    lat: location.lat,
    lng: location.lng,
    display_name: result.formatted_address ?? address,
  }
}

// ── Distance Matrix: road distance + duration ─────────────────────────────────
export async function getRouteDistance(
  originLat: number, originLng: number,
  destLat:   number, destLng:   number
): Promise<DistanceResult> {
  const GMAPS_KEY = (() => {
    try { return getApiKey() } catch { return null }
  })()

  if (!GMAPS_KEY) {
    return fallbackDistance(originLat, originLng, destLat, destLng)
  }

  checkApiRateLimit('distancematrix')

  const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json')
  url.searchParams.set('origins',      `${originLat},${originLng}`)
  url.searchParams.set('destinations', `${destLat},${destLng}`)
  url.searchParams.set('key',          GMAPS_KEY)
  url.searchParams.set('mode',         'driving')
  url.searchParams.set('language',     'id')

  let res: Response
  try {
    res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(8000),
    })
  } catch {
    return fallbackDistance(originLat, originLng, destLat, destLng)
  }

  const data = await res.json()

  if (data.status !== 'OK') {
    console.warn(`[GiriGo Maps] Distance Matrix failed: ${data.status}`)
    return fallbackDistance(originLat, originLng, destLat, destLng)
  }

  const element = data.rows?.[0]?.elements?.[0]
  if (element?.status !== 'OK') {
    console.warn(`[GiriGo Maps] Route not found between coordinates`)
    return fallbackDistance(originLat, originLng, destLat, destLng)
  }

  return {
    distance_km:  Math.round((element.distance.value / 1000) * 100) / 100,
    duration_min: Math.round(element.duration.value / 60),
    nav_link:     generateNavLink(destLat, destLng),
  }
}

// ── Haversine fallback with road factor ──────────────────────────────────────
function fallbackDistance(
  originLat: number, originLng: number,
  destLat: number, destLng: number
): DistanceResult {
  const straight = haversineKm(originLat, originLng, destLat, destLng)
  const roadKm   = Math.round(straight * 1.25 * 100) / 100
  return {
    distance_km:  roadKm,
    duration_min: Math.round(roadKm * 4),
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
