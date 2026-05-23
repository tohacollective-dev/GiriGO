// =============================================================================
// GET  /api/orders — List orders (admin)
// POST /api/orders — Create order (internal/bot)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { calculatePrice } from '@/lib/pricing'

const createSchema = z.object({
  customer_id:     z.string().uuid(),
  pickup_address:  z.string().min(3),
  pickup_lat:      z.number(),
  pickup_lng:      z.number(),
  dropoff_address: z.string().min(3),
  dropoff_lat:     z.number(),
  dropoff_lng:     z.number(),
  item_type:       z.string().default('Paket'),
  item_weight_kg:  z.number().positive().default(1.0),
  notes:           z.string().optional(),
  distance_km:     z.number().positive(),
  payment_method:  z.enum(['cod', 'transfer', 'ewallet']),
  package_value:   z.number().min(0).default(0),
})

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const status   = searchParams.get('status')
  const limit    = Number(searchParams.get('limit')  ?? 50)
  const offset   = Number(searchParams.get('offset') ?? 0)

  let query = supabaseAdmin
    .from('orders')
    .select('*, customer:users!customer_id(name, phone), courier:couriers(*, user:users(name, phone))')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, count })
}

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
    }

    const d       = parsed.data
    const pricing = calculatePrice(d.distance_km, d.item_weight_kg)

    const { data, error } = await supabaseAdmin
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
        notes:           d.notes,
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

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
