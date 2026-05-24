// =============================================================================
// GiriGo — Route-Based Courier Matching Engine
// Scoring: Exact route match (100) + Similar (75) + Distance contrib +
//          Capacity (max 15) + Rating (max 50)
// =============================================================================

import { supabaseAdmin }         from '@/lib/supabase'
import { haversineKm }           from '@/lib/maps'
import type { RouteCourierScore } from '@/types'

// ── Constants ─────────────────────────────────────────────────────────────────
const ROUTE_AREA_RADIUS_KM   = 1.5   // coords within this radius are "same area"
const MAX_ORDERS_PER_ROUTE   = 3     // maximum batched orders per route
const MAX_PICKUP_DISTANCE_KM = 5     // courier must be within this of new pickup
const AVG_SPEED_KMH          = 25    // local delivery speed (km/h)
const SINGLE_TRIP_BASE_IDR   = 5_000 // base fare for a solo delivery trip

// ── haversineDistance ─────────────────────────────────────────────────────────
// Thin wrapper kept for spec compatibility; internals use haversineKm directly.
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  return haversineKm(lat1, lng1, lat2, lng2)
}

// ── isCoordinatesInArea ───────────────────────────────────────────────────────
export function isCoordinatesInArea(
  checkLat:  number, checkLng:  number,
  centerLat: number, centerLng: number,
  radiusKm = ROUTE_AREA_RADIUS_KM,
): boolean {
  return haversineKm(checkLat, checkLng, centerLat, centerLng) <= radiusKm
}

// ── estimateDeliveryTime ──────────────────────────────────────────────────────
export function estimateDeliveryTime(
  distanceKm:    number,
  orderCount:    number  = 1,
  trafficFactor: number  = 1.3,  // 1.0 = free flow
): { minutes: number; eta: Date } {
  const travelMin = Math.round((distanceKm / AVG_SPEED_KMH) * 60 * trafficFactor)
  const stopMin   = orderCount * 3  // ~3 min per stop
  const total     = travelMin + stopMin
  return { minutes: total, eta: new Date(Date.now() + total * 60_000) }
}

// ── calculateCostSavings ──────────────────────────────────────────────────────
export function calculateCostSavings(
  routeDistanceKm: number,
  orderCount:      number,
): { saved_idr: number; efficiency_pct: number } {
  if (orderCount <= 1) return { saved_idr: 0, efficiency_pct: 0 }
  const soloTotal    = SINGLE_TRIP_BASE_IDR * orderCount
  const routeTotal   = SINGLE_TRIP_BASE_IDR + Math.round(routeDistanceKm * 2_000)
  const saved_idr    = Math.max(0, soloTotal - routeTotal)
  const efficiency_pct = Math.round((saved_idr / soloTotal) * 100)
  return { saved_idr, efficiency_pct }
}

// ── calculateRouteDistance ────────────────────────────────────────────────────
// Cumulative distance: courier → wp[0] → wp[1] → … → wp[n]
export function calculateRouteDistance(
  courierLat: number, courierLng: number,
  waypoints:  Array<{ lat: number; lng: number }>,
): number {
  if (!waypoints.length) return 0
  let total = haversineKm(courierLat, courierLng, waypoints[0].lat, waypoints[0].lng)
  for (let i = 0; i < waypoints.length - 1; i++) {
    total += haversineKm(waypoints[i].lat, waypoints[i].lng, waypoints[i + 1].lat, waypoints[i + 1].lng)
  }
  return Math.round(total * 100) / 100
}

// ── isRouteMatching ───────────────────────────────────────────────────────────
export type MatchType = 'exact' | 'similar' | 'nearby' | 'none'

export interface RouteMatchResult {
  matches:              boolean
  match_type:           MatchType
  distance_to_pickup_m: number
  reason?:              string
}

export function isRouteMatching(
  route: {
    start_lat:    number; start_lng:   number
    end_lat:      number; end_lng:     number
    current_lat:  number; current_lng: number
    orders_count: number
  },
  newOrder: {
    pickup_lat:  number; pickup_lng:  number
    dropoff_lat: number; dropoff_lng: number
  },
): RouteMatchResult {
  if (route.orders_count >= MAX_ORDERS_PER_ROUTE) {
    return { matches: false, match_type: 'none', distance_to_pickup_m: Infinity, reason: 'Route at capacity' }
  }

  const distKm = haversineKm(
    route.current_lat, route.current_lng,
    newOrder.pickup_lat, newOrder.pickup_lng,
  )

  if (distKm > MAX_PICKUP_DISTANCE_KM) {
    return {
      matches: false, match_type: 'none',
      distance_to_pickup_m: distKm * 1000,
      reason: `Courier ${distKm.toFixed(1)}km from pickup (max ${MAX_PICKUP_DISTANCE_KM}km)`,
    }
  }

  const pickupNearStart  = isCoordinatesInArea(newOrder.pickup_lat,  newOrder.pickup_lng,  route.start_lat, route.start_lng)
  const dropoffNearEnd   = isCoordinatesInArea(newOrder.dropoff_lat, newOrder.dropoff_lng, route.end_lat,   route.end_lng)

  if (pickupNearStart && dropoffNearEnd) {
    return { matches: true, match_type: 'exact',   distance_to_pickup_m: distKm * 1000 }
  }
  if (pickupNearStart || dropoffNearEnd) {
    return { matches: true, match_type: 'similar', distance_to_pickup_m: distKm * 1000 }
  }
  if (distKm <= 2.0) {
    return { matches: true, match_type: 'nearby',  distance_to_pickup_m: distKm * 1000 }
  }

  return { matches: false, match_type: 'none', distance_to_pickup_m: distKm * 1000, reason: 'No route overlap' }
}

// ── scoreCourierForRoute ──────────────────────────────────────────────────────
export function scoreCourierForRoute(
  courier: {
    id: string; name: string; phone: string
    rating: number; current_lat: number; current_lng: number
  },
  route: {
    id: string | null
    start_lat: number; start_lng: number
    end_lat:   number; end_lng:   number
    orders_count: number
  } | null,
  newOrder: {
    pickup_lat:  number; pickup_lng:  number
    dropoff_lat: number; dropoff_lng: number
  },
): RouteCourierScore {
  let baseScore:          number   = 0
  let matchType:          MatchType = 'none'
  let distanceToPickupM:  number   = Infinity

  if (route) {
    const mr      = isRouteMatching(
      { ...route, current_lat: courier.current_lat, current_lng: courier.current_lng },
      newOrder,
    )
    matchType            = mr.match_type
    distanceToPickupM    = mr.distance_to_pickup_m

    if      (matchType === 'exact')   baseScore = 100
    else if (matchType === 'similar') baseScore = 75
    else if (matchType === 'nearby')  baseScore = Math.max(0, (5000 - distanceToPickupM) / 100)
  } else {
    distanceToPickupM = haversineKm(
      courier.current_lat, courier.current_lng,
      newOrder.pickup_lat, newOrder.pickup_lng,
    ) * 1000
    baseScore = Math.max(0, (5000 - distanceToPickupM) / 100)
  }

  // Capacity: (max - current) * 5  → max 15 pts
  const capacityScore = Math.max(0, (MAX_ORDERS_PER_ROUTE - (route?.orders_count ?? 0)) * 5)
  // Rating: rating * 10            → max 50 pts
  const ratingScore   = (courier.rating ?? 5.0) * 10

  return {
    courier_id:           courier.id,
    courier_name:         courier.name,
    courier_phone:        courier.phone,
    route_id:             route?.id ?? null,
    total_score:          baseScore + capacityScore + ratingScore,
    match_type:           matchType,
    distance_to_pickup_m: distanceToPickupM,
    orders_in_route:      route?.orders_count ?? 0,
    rating:               courier.rating,
  }
}

// ── getBestMatchedCouriers ────────────────────────────────────────────────────
export async function getBestMatchedCouriers(
  pickupLat:  number, pickupLng:  number,
  dropoffLat: number, dropoffLng: number,
  topN = 3,
): Promise<RouteCourierScore[]> {
  const { data: couriers, error } = await supabaseAdmin
    .from('couriers')
    .select('id, rating, status, current_lat, current_lng, user:users!couriers_user_id_fkey(name, phone)')
    .in('status', ['online', 'busy'])
    .not('current_lat', 'is', null)
    .not('current_lng', 'is', null)

  if (error || !couriers?.length) return []

  const courierIds = couriers.map(c => c.id)

  const { data: routes } = await supabaseAdmin
    .from('courier_active_routes')
    .select('id, courier_id, start_lat, start_lng, end_lat, end_lng, orders_in_route, status')
    .in('courier_id', courierIds)
    .in('status', ['active', 'idle'])

  const routeMap: Record<string, NonNullable<typeof routes>[number]> = {}
  for (const r of routes ?? []) routeMap[r.courier_id] = r

  const scores = couriers.map(c => {
    const user  = Array.isArray(c.user) ? c.user[0] : c.user
    const route = routeMap[c.id] ?? null

    return scoreCourierForRoute(
      {
        id:          c.id,
        name:        (user as any)?.name  ?? '',
        phone:       (user as any)?.phone ?? '',
        rating:      c.rating,
        current_lat: c.current_lat!,
        current_lng: c.current_lng!,
      },
      route ? {
        id:           route.id,
        start_lat:    route.start_lat as number,
        start_lng:    route.start_lng as number,
        end_lat:      route.end_lat   as number,
        end_lng:      route.end_lng   as number,
        orders_count: (route.orders_in_route as string[])?.length ?? 0,
      } : null,
      { pickup_lat: pickupLat, pickup_lng: pickupLng, dropoff_lat: dropoffLat, dropoff_lng: dropoffLng },
    )
  })

  return scores
    .filter(s => s.total_score > 0)
    .sort((a, b) => b.total_score - a.total_score)
    .slice(0, topN)
}

// ── upsertCourierRoute ────────────────────────────────────────────────────────
// Called after a courier accepts an order — creates or updates their active route.
export async function upsertCourierRoute(
  courierId: string,
  orderId:   string,
  order: {
    pickup_address:  string; pickup_lat:  number; pickup_lng:  number
    dropoff_address: string; dropoff_lat: number; dropoff_lng: number
  },
  existingRouteId: string | null,
): Promise<string | null> {
  try {
    if (existingRouteId) {
      // Append order to existing route
      const { data: existing } = await supabaseAdmin
        .from('courier_active_routes')
        .select('orders_in_route, start_lat, start_lng, end_lat, end_lng')
        .eq('id', existingRouteId)
        .single()

      if (!existing) return null

      const updatedOrders = [...((existing.orders_in_route as string[]) ?? []), orderId]
      const dist = calculateRouteDistance(
        existing.start_lat as number, existing.start_lng as number,
        [
          { lat: order.pickup_lat,  lng: order.pickup_lng  },
          { lat: order.dropoff_lat, lng: order.dropoff_lng },
        ],
      )
      const { eta } = estimateDeliveryTime(dist, updatedOrders.length)

      await supabaseAdmin
        .from('courier_active_routes')
        .update({
          orders_in_route:           updatedOrders,
          total_distance_km:         dist,
          estimated_completion_time: eta.toISOString(),
          status:                    'active',
        })
        .eq('id', existingRouteId)

      return existingRouteId

    } else {
      // Create new route
      const dist = calculateRouteDistance(
        order.pickup_lat, order.pickup_lng,
        [{ lat: order.dropoff_lat, lng: order.dropoff_lng }],
      )
      const { eta } = estimateDeliveryTime(dist, 1)

      const { data, error } = await supabaseAdmin
        .from('courier_active_routes')
        .insert({
          courier_id:                courierId,
          route_start_address:       order.pickup_address,
          route_end_address:         order.dropoff_address,
          start_lat:                 order.pickup_lat,
          start_lng:                 order.pickup_lng,
          end_lat:                   order.dropoff_lat,
          end_lng:                   order.dropoff_lng,
          current_location:          { lat: order.pickup_lat, lng: order.pickup_lng, updated_at: new Date().toISOString() },
          orders_in_route:           [orderId],
          total_distance_km:         dist,
          estimated_completion_time: eta.toISOString(),
          status:                    'active',
        })
        .select('id')
        .single()

      if (error) return null
      return data.id as string
    }
  } catch {
    return null
  }
}
