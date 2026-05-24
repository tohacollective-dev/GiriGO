// =============================================================================
// POST /api/orders/assign-with-route-matching
// Route-optimised order assignment — tries route matching first, distance fallback
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { z }                         from 'zod'
import { supabaseAdmin }             from '@/lib/supabase'
import { calculatePrice }            from '@/lib/pricing'
import {
  getBestMatchedCouriers,
  upsertCourierRoute,
  estimateDeliveryTime,
  calculateRouteDistance,
}                                    from '@/lib/route-matching'

const schema = z.object({
  // Supply either an existing order_id OR full order details
  order_id:        z.string().uuid().optional(),
  customer_id:     z.string().uuid().optional(),
  pickup_address:  z.string().min(3),
  pickup_lat:      z.number(),
  pickup_lng:      z.number(),
  dropoff_address: z.string().min(3),
  dropoff_lat:     z.number(),
  dropoff_lng:     z.number(),
  item_weight_kg:  z.number().positive().default(1.0),
  item_type:       z.string().default('Paket'),
  payment_method:  z.enum(['cod', 'transfer', 'ewallet']).default('transfer'),
  package_value:   z.number().min(0).default(0),
  distance_km:     z.number().positive(),
})

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
    }

    const d = parsed.data

    // ── 1. Resolve or create the order ────────────────────────────────────────
    let orderId: string
    let orderData: Record<string, unknown>

    if (d.order_id) {
      const { data: existing, error } = await supabaseAdmin
        .from('orders')
        .select('id, status')
        .eq('id', d.order_id)
        .single()
      if (error || !existing) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      if (existing.status !== 'pending') {
        return NextResponse.json({ error: `Order is already ${existing.status}` }, { status: 409 })
      }
      orderId   = existing.id
      orderData = d as any
    } else {
      if (!d.customer_id) {
        return NextResponse.json({ error: 'customer_id required when order_id is not provided' }, { status: 422 })
      }
      const pricing = calculatePrice(d.distance_km, d.item_weight_kg)
      const { data: created, error } = await supabaseAdmin
        .from('orders')
        .insert({
          customer_id:     d.customer_id,
          pickup_address:  d.pickup_address,
          pickup_lat:      d.pickup_lat,
          pickup_lng:      d.pickup_lng,
          dropoff_address: d.dropoff_address,
          dropoff_lat:     d.dropoff_lat,
          dropoff_lng:     d.dropoff_lng,
          item_type:       d.item_type,
          item_weight_kg:  d.item_weight_kg,
          distance_km:     d.distance_km,
          base_fee:        pricing.base_fee,
          weight_surcharge: pricing.weight_surcharge,
          delivery_fee:    pricing.delivery_fee,
          package_value:   d.package_value,
          payment_method:  d.payment_method,
          status:          'pending',
        })
        .select()
        .single()
      if (error || !created) {
        return NextResponse.json({ error: error?.message ?? 'Failed to create order' }, { status: 500 })
      }
      orderId   = created.id
      orderData = created
    }

    // ── 2. Find best-matched couriers ─────────────────────────────────────────
    const candidates = await getBestMatchedCouriers(
      d.pickup_lat, d.pickup_lng,
      d.dropoff_lat, d.dropoff_lng,
    )

    if (!candidates.length) {
      return NextResponse.json(
        { error: 'No available couriers in area', order_id: orderId },
        { status: 503 },
      )
    }

    const best = candidates[0]

    // ── 3. Assign order to best courier ───────────────────────────────────────
    const now = new Date().toISOString()
    const { error: assignErr } = await supabaseAdmin
      .from('orders')
      .update({ courier_id: best.courier_id, status: 'assigned', assigned_at: now })
      .eq('id', orderId)

    if (assignErr) {
      return NextResponse.json({ error: assignErr.message }, { status: 500 })
    }

    // Mark courier busy
    await supabaseAdmin
      .from('couriers')
      .update({ status: 'busy' })
      .eq('id', best.courier_id)

    // Log dispatch
    await supabaseAdmin.from('dispatch_log').insert({
      order_id:    orderId,
      courier_id:  best.courier_id,
      attempt:     1,
      score:       best.total_score,
      result:      'accepted',
      offered_at:  now,
      responded_at: now,
    })

    // ── 4. Upsert courier route ───────────────────────────────────────────────
    const routeId = await upsertCourierRoute(
      best.courier_id,
      orderId,
      {
        pickup_address:  d.pickup_address,  pickup_lat:  d.pickup_lat,  pickup_lng:  d.pickup_lng,
        dropoff_address: d.dropoff_address, dropoff_lat: d.dropoff_lat, dropoff_lng: d.dropoff_lng,
      },
      best.route_id,
    )

    if (routeId) {
      await supabaseAdmin
        .from('orders')
        .update({ assigned_route_id: routeId })
        .eq('id', orderId)
    }

    // ── 5. Build response ─────────────────────────────────────────────────────
    const distKm     = calculateRouteDistance(
      d.pickup_lat, d.pickup_lng,
      [{ lat: d.dropoff_lat, lng: d.dropoff_lng }],
    )
    const { minutes: pickupMin } = estimateDeliveryTime(best.distance_to_pickup_m / 1000, 0)
    const { minutes: dropoffMin } = estimateDeliveryTime(distKm, best.orders_in_route + 1)
    const pricing = calculatePrice(d.distance_km, d.item_weight_kg)

    const pickupEta  = new Date(Date.now() + pickupMin  * 60_000)
    const dropoffEta = new Date(Date.now() + dropoffMin * 60_000)

    return NextResponse.json({
      assigned_courier_id:    best.courier_id,
      order_id:               orderId,
      route_id:               routeId,
      route_info: {
        match_type:        best.match_type,
        orders_in_route:   best.orders_in_route + 1,
        total_distance_km: distKm,
        score:             best.total_score,
      },
      estimated_pickup_time:  pickupEta.toISOString(),
      estimated_dropoff_time: dropoffEta.toISOString(),
      cost_estimate:          pricing.delivery_fee,
      candidates:             candidates.map(c => ({
        courier_id:   c.courier_id,
        name:         c.courier_name,
        score:        c.total_score,
        match_type:   c.match_type,
        distance_m:   Math.round(c.distance_to_pickup_m),
      })),
    }, { status: 201 })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
