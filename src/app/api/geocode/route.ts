// =============================================================================
// POST /api/geocode — Geocode two addresses + calculate distance + fee
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { geocodeAddress, getRouteDistance } from '@/lib/maps'
import { calculatePrice } from '@/lib/pricing'
import { applyRateLimit } from '@/lib/rate-limit'

// ── Validation ───────────────────────────────────────────────────────────────
const schema = z.object({
  pickup_address: z
    .string()
    .min(3, 'Alamat penjemputan minimal 3 karakter')
    .max(300, 'Alamat penjemputan terlalu panjang'),
  dropoff_address: z
    .string()
    .min(3, 'Alamat tujuan minimal 3 karakter')
    .max(300, 'Alamat tujuan terlalu panjang'),
  weight_kg: z.number().positive().default(1.0),
})

// ── Response types ───────────────────────────────────────────────────────────
interface GeocodeResponseSuccess {
  pickup: { address: string; lat: number; lng: number; nav_link: string }
  dropoff: { address: string; lat: number; lng: number; nav_link: string }
  distance_km: number
  duration_min: number
  pricing: ReturnType<typeof calculatePrice>
}

export async function POST(req: NextRequest): Promise<Response> {
  const limited = applyRateLimit(req, 'geocode')
  if (limited) return limited

  try {
    let raw: unknown
    try {
      raw = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // ── Validate input ───────────────────────────────────────────────────────
    const parsed = schema.safeParse(raw)

    if (!parsed.success) {
      const issues = parsed.error.issues
      const firstError = issues[0]?.message ?? 'Invalid request data'

      return NextResponse.json(
        { error: firstError, details: parsed.error.flatten() },
        { status: 422 }
      )
    }

    const { pickup_address, dropoff_address, weight_kg } = parsed.data

    // ── Trim and validate addresses are different ────────────────────────────
    const pAddr = pickup_address.trim()
    const dAddr = dropoff_address.trim()

    if (pAddr.toLowerCase() === dAddr.toLowerCase()) {
      return NextResponse.json(
        { error: 'Alamat penjemputan dan tujuan tidak boleh sama' },
        { status: 422 }
      )
    }

    // ── Geocode both addresses in parallel ───────────────────────────────────
    let pickup: { lat: number; lng: number; display_name: string }
    let dropoff: { lat: number; lng: number; display_name: string }

    try {
      const results = await Promise.all([
        geocodeAddress(pAddr),
        geocodeAddress(dAddr),
      ])
      pickup = results[0]
      dropoff = results[1]
    } catch (geoErr: any) {
      console.error('[Geocode API] Geocoding failed:', geoErr.message)
      return NextResponse.json(
        { error: `Gagal mencari koordinat: ${geoErr.message}` },
        { status: 502 }
      )
    }

    // ── Get road distance ────────────────────────────────────────────────────
    let route: { distance_km: number; duration_min: number; nav_link: string }

    try {
      route = await getRouteDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng)
    } catch (routeErr: any) {
      console.error('[Geocode API] Distance Matrix failed:', routeErr.message)
      return NextResponse.json(
        { error: `Gagal menghitung jarak: ${routeErr.message}` },
        { status: 502 }
      )
    }

    // ── Calculate fee ────────────────────────────────────────────────────────
    const pricing = calculatePrice(route.distance_km, weight_kg)

    return NextResponse.json({
      pickup: {
        address: pickup.display_name,
        lat: pickup.lat,
        lng: pickup.lng,
        nav_link: route.nav_link,
      },
      dropoff: {
        address: dropoff.display_name,
        lat: dropoff.lat,
        lng: dropoff.lng,
        nav_link: `https://www.google.com/maps/dir/?api=1&destination=${dropoff.lat},${dropoff.lng}`,
      },
      distance_km: route.distance_km,
      duration_min: route.duration_min,
      pricing,
    })
  } catch (err: any) {
    console.error('[Geocode API] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Terjadi kesalahan internal. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}
