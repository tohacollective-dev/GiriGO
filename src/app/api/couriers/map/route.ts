import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Returns ALL couriers with their GPS coords + active order count
// Used exclusively by the admin real-time map — refreshed every 10s
export async function GET() {
  const { data: couriers, error: cErr } = await supabaseAdmin
    .from('couriers')
    .select(`
      id, status, current_lat, current_lng, location_updated,
      vehicle_type, rating, total_orders,
      user:users!couriers_user_id_fkey (name, phone)
    `)
    .order('status')            // online first

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })

  // Fetch active (assigned / picked_up) orders for each courier
  const { data: activeOrders, error: oErr } = await supabaseAdmin
    .from('orders')
    .select('courier_id, order_code, status, pickup_address, dropoff_address')
    .in('status', ['assigned', 'picked_up'])

  if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 })

  // Index active orders by courier_id
  const orderByCourier = (activeOrders ?? []).reduce<Record<string, typeof activeOrders[0]>>(
    (acc, o) => { if (o.courier_id) acc[o.courier_id] = o; return acc },
    {}
  )

  const result = (couriers ?? []).map(c => ({
    ...c,
    active_order: orderByCourier[c.id] ?? null,
  }))

  return NextResponse.json({
    couriers: result,
    timestamp: new Date().toISOString(),
    counts: {
      total:   result.length,
      online:  result.filter(c => c.status === 'online').length,
      busy:    result.filter(c => c.status === 'busy').length,
      offline: result.filter(c => c.status === 'offline').length,
    },
  })
}
