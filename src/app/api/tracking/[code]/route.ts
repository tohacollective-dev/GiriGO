// =============================================================================
// GET /api/tracking/[code] — Public tracking endpoint (no auth)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      order_code, status, item_type,
      pickup_address, dropoff_address,
      distance_km, delivery_fee, payment_method,
      created_at, assigned_at, picked_up_at, delivered_at,
      courier:couriers(
        rating, current_lat, current_lng,
        user:users(name)
      )
    `)
    .eq('order_code', params.code.toUpperCase())
    .single()

  if (error) {
    console.error('[Tracking] DB error:', error.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Don't expose customer PII in public endpoint
  return NextResponse.json({
    order_code:    data.order_code,
    status:        data.status,
    item_type:     data.item_type,
    pickup_address: data.pickup_address,
    dropoff_address: data.dropoff_address,
    distance_km:   data.distance_km,
    delivery_fee:  data.delivery_fee,
    payment_method: data.payment_method,
    courier_name:  (data.courier as any)?.user?.name ?? null,
    courier_lat:   (data.courier as any)?.current_lat ?? null,
    courier_lng:   (data.courier as any)?.current_lng ?? null,
    courier_rating: (data.courier as any)?.rating ?? null,
    timeline: {
      pending:    data.created_at,
      assigned:   data.assigned_at,
      picked_up:  data.picked_up_at,
      delivered:  data.delivered_at,
    },
  })
}
