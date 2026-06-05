// =============================================================================
// GET /api/couriers/:id/active-route
// Returns a courier's current active/idle route + all orders within it
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin }             from '@/lib/supabase'
import { requireAuth }               from '@/lib/api-auth'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const courierId = params.id

  // Fetch courier profile
  const { data: courier, error: cErr } = await supabaseAdmin
    .from('couriers')
    .select('id, status, current_lat, current_lng, rating, user:users!couriers_user_id_fkey(name, phone)')
    .eq('id', courierId)
    .single()

  if (cErr || !courier) {
    return NextResponse.json({ error: 'Courier not found' }, { status: 404 })
  }

  // Fetch active/idle route
  const { data: route, error: rErr } = await supabaseAdmin
    .from('courier_active_routes')
    .select('*')
    .eq('courier_id', courierId)
    .in('status', ['active', 'idle'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (rErr) {
    return NextResponse.json({ error: rErr.message }, { status: 500 })
  }

  if (!route) {
    return NextResponse.json({ courier, route: null, orders: [] })
  }

  // Fetch orders within this route
  const orderIds: string[] = (route.orders_in_route as string[]) ?? []
  let orders: unknown[] = []

  if (orderIds.length) {
    const { data: orderRows } = await supabaseAdmin
      .from('orders')
      .select('id, order_code, pickup_address, dropoff_address, status, delivery_fee, payment_method, created_at, customer:users!customer_id(name, phone)')
      .in('id', orderIds)

    orders = orderRows ?? []
  }

  return NextResponse.json({ courier, route, orders })
}
