// =============================================================================
// POST /api/geocode — Geocode two addresses + calculate distance + fee
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { geocodeAddress, getRouteDistance } from '@/lib/maps'
import { calculatePrice } from '@/lib/pricing'

const schema = z.object({
  pickup_address:  z.string().min(3).max(300),
  dropoff_address: z.string().min(3).max(300),
  weight_kg:       z.number().positive().default(1.0),
})

export async function POST(req: NextRequest) {
  try {
    const raw    = await req.json()
    const parsed = schema.safeParse(raw)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 422 }
      )
    }

    const { pickup_address, dropoff_address, weight_kg } = parsed.data

    // Geocode both addresses in parallel
    const [pickup, dropoff] = await Promise.all([
      geocodeAddress(pickup_address),
      geocodeAddress(dropoff_address),
    ])

    // Get road distance
    const route = await getRouteDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng)

    // Calculate fee
    const pricing = calculatePrice(route.distance_km, weight_kg)

    return NextResponse.json({
      pickup: {
        address:      pickup.display_name,
        lat:          pickup.lat,
        lng:          pickup.lng,
        nav_link:     route.nav_link,
      },
      dropoff: {
        address:      dropoff.display_name,
        lat:          dropoff.lat,
        lng:          dropoff.lng,
        nav_link:     `https://www.google.com/maps/dir/?api=1&destination=${dropoff.lat},${dropoff.lng}`,
      },
      distance_km:     route.distance_km,
      duration_min:    route.duration_min,
      pricing,
    })
  } catch (err: any) {
    console.error('[Geocode API]', err.message)
    return NextResponse.json(
      { error: err.message ?? 'Geocoding failed' },
      { status: 502 }
    )
  }
}
