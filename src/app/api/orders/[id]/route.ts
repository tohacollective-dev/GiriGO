// =============================================================================
// GET   /api/orders/[id]       — Get single order
// PATCH /api/orders/[id]       — Update order status / courier fields
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { validateTransition } from '@/lib/order-state'

const patchSchema = z.object({
  status:            z.enum(['pending','assigned','picked_up','delivered','cancelled','failed']).optional(),
  courier_id:        z.string().uuid().optional(),
  pickup_photo_url:  z.string().url().optional(),
  dropoff_photo_url: z.string().url().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, customer:users!customer_id(name, phone), courier:couriers(*, user:users(name, phone))')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ data })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body   = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

    // ── State machine validation ───────────────────────────────────────────────
    if (parsed.data.status) {
      const { data: current, error: fetchErr } = await supabaseAdmin
        .from('orders')
        .select('status')
        .eq('id', params.id)
        .single()

      if (fetchErr || !current) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      const transition = validateTransition(current.status, parsed.data.status)
      if (!transition.valid) {
        return NextResponse.json({ error: transition.error }, { status: 422 })
      }
    }

    const update: Record<string, unknown> = { ...parsed.data }

    // Set timestamp fields automatically
    if (parsed.data.status === 'assigned')   update.assigned_at  = new Date().toISOString()
    if (parsed.data.status === 'picked_up')  update.picked_up_at = new Date().toISOString()
    if (parsed.data.status === 'delivered')  update.delivered_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(update)
      .eq('id', params.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
