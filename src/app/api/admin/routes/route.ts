// =============================================================================
// GET /api/admin/routes — Route Optimization dashboard data
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { calculateCostSavings } from '@/lib/route-matching'
import { requireAuth } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const [routesRes, allOrdersRes] = await Promise.all([
    supabaseAdmin
      .from('courier_active_routes')
      .select(`
        id, status, orders_in_route, total_distance_km,
        route_start_address, route_end_address,
        start_lat, start_lng, end_lat, end_lng,
        current_location, estimated_completion_time,
        created_at, updated_at,
        courier:couriers!courier_active_routes_courier_id_fkey(
          id, status, rating, current_lat, current_lng,
          user:users!couriers_user_id_fkey(name, phone)
        )
      `)
      .in('status', ['active', 'idle'])
      .order('created_at', { ascending: false }),

    // Total orders delivered (for efficiency calculation)
    supabaseAdmin
      .from('orders')
      .select('id, assigned_route_id, status, delivery_fee')
      .in('status', ['assigned', 'picked_up', 'delivered'])
      .gte('created_at', new Date(Date.now() - 86_400_000).toISOString()),  // last 24h
  ])

  const routes      = routesRes.data  ?? []
  const recentOrders = allOrdersRes.data ?? []

  // Compute route efficiency stats
  const totalRecentOrders    = recentOrders.length
  const routeOptimizedOrders = recentOrders.filter(o => o.assigned_route_id).length
  const efficiencyPct        = totalRecentOrders > 0
    ? Math.round((routeOptimizedOrders / totalRecentOrders) * 100)
    : 0

  // Compute total cost savings across active routes
  let totalSavedIdr = 0
  for (const r of routes) {
    const count = (r.orders_in_route as string[])?.length ?? 0
    if (count > 1) {
      const { saved_idr } = calculateCostSavings(
        Number(r.total_distance_km) || 0,
        count,
      )
      totalSavedIdr += saved_idr
    }
  }

  // Collect order IDs across all active routes for batch fetch
  const allOrderIds: string[] = routes.flatMap(r => (r.orders_in_route as string[]) ?? [])
  let routeOrders: Record<string, unknown[]> = {}

  if (allOrderIds.length) {
    const { data: orderRows } = await supabaseAdmin
      .from('orders')
      .select('id, order_code, pickup_address, dropoff_address, status, delivery_fee, payment_method, assigned_route_id')
      .in('id', allOrderIds)

    for (const o of orderRows ?? []) {
      const rid = (o as any).assigned_route_id ?? '__unknown'
      if (!routeOrders[rid]) routeOrders[rid] = []
      routeOrders[rid].push(o)
    }
  }

  return NextResponse.json({
    routes: routes.map(r => ({
      ...r,
      orders: routeOrders[r.id] ?? [],
    })),
    stats: {
      active_routes:          routes.length,
      batched_orders:         routes.reduce((s, r) => s + ((r.orders_in_route as string[])?.length ?? 0), 0),
      total_saved_idr:        totalSavedIdr,
      efficiency_pct:         efficiencyPct,
      total_orders_today:     totalRecentOrders,
      route_optimized_orders: routeOptimizedOrders,
    },
    timestamp: new Date().toISOString(),
  })
}
