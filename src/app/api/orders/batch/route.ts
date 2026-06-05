// =============================================================================
// PATCH /api/orders/batch — Bulk assign / cancel orders
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'

const batchSchema = z.object({
  action:     z.enum(['assign', 'cancel']),
  order_ids:  z.array(z.string().uuid()).min(1).max(500),
  courier_id: z.string().uuid().optional(),
})

export async function PATCH(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = batchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

    const { action, order_ids, courier_id } = parsed.data

    if (action === 'assign' && !courier_id) {
      return NextResponse.json({ error: 'courier_id is required for assign action' }, { status: 422 })
    }

    // Fetch current orders to validate statuses
    const { data: existingOrders, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .in('id', order_ids)

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
    if (!existingOrders || existingOrders.length === 0) {
      return NextResponse.json({ error: 'No matching orders found' }, { status: 404 })
    }

    const existingIds = new Set(existingOrders.map(o => o.id))
    const notFound     = order_ids.filter(id => !existingIds.has(id))
    const failures: { order_id: string; reason: string }[] = []

    if (action === 'assign') {
      // Only assign orders that are 'pending'
      const assignable = existingOrders.filter(o => o.status === 'pending')
      const nonPending = existingOrders.filter(o => o.status !== 'pending')

      nonPending.forEach(o => failures.push({
        order_id: o.id,
        reason: `Status ${o.status} tidak bisa di-assign`,
      }))

      if (assignable.length > 0) {
        const assignIds = assignable.map(o => o.id)
        const { error } = await supabaseAdmin
          .from('orders')
          .update({
            status:      'assigned',
            courier_id:  courier_id!,
            assigned_at: new Date().toISOString(),
          })
          .in('id', assignIds)

        if (error) {
          assignIds.forEach(id => failures.push({ order_id: id, reason: error.message }))
        }
      }

      notFound.forEach(id => failures.push({ order_id: id, reason: 'Not found' }))

      return NextResponse.json({
        action:  'assign',
        updated: order_ids.length - failures.length,
        failed:  failures,
      })
    }

    if (action === 'cancel') {
      // Only cancel orders that aren't already delivered/cancelled/failed
      const blockedStatuses = new Set(['delivered', 'cancelled', 'failed'])
      const cancellable = existingOrders.filter(o => !blockedStatuses.has(o.status as string))
      const blocked     = existingOrders.filter(o => blockedStatuses.has(o.status as string))

      blocked.forEach(o => failures.push({
        order_id: o.id,
        reason: `Status ${o.status} tidak bisa dibatalkan`,
      }))

      if (cancellable.length > 0) {
        const cancelIds = cancellable.map(o => o.id)
        const { error } = await supabaseAdmin
          .from('orders')
          .update({ status: 'cancelled' })
          .in('id', cancelIds)

        if (error) {
          cancelIds.forEach(id => failures.push({ order_id: id, reason: error.message }))
        }
      }

      notFound.forEach(id => failures.push({ order_id: id, reason: 'Not found' }))

      return NextResponse.json({
        action:  'cancel',
        updated: order_ids.length - failures.length,
        failed:  failures,
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
