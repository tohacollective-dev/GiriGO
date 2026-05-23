// =============================================================================
// POST /api/ratings — Submit a courier rating after delivery
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'

const schema = z.object({
  order_id:    z.string().uuid(),
  customer_id: z.string().uuid(),
  courier_id:  z.string().uuid(),
  score:       z.number().int().min(1).max(5),
  comment:     z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

    // Verify order is delivered and belongs to customer
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('status, customer_id, courier_id')
      .eq('id', parsed.data.order_id)
      .single()

    if (!order || order.status !== 'delivered') {
      return NextResponse.json({ error: 'Order not eligible for rating' }, { status: 400 })
    }
    if (order.customer_id !== parsed.data.customer_id) {
      return NextResponse.json({ error: 'Not your order' }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
      .from('ratings')
      .insert(parsed.data)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Already rated' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update WA session back to idle
    await supabaseAdmin
      .from('wa_sessions')
      .update({ state: 'idle', context: {} })
      .eq('user_id', parsed.data.customer_id)

    return NextResponse.json({ data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
