// =============================================================================
// POST /api/courier/respond — Courier accepts or rejects a job offer
// Called from WhatsApp bot when courier replies "1" or "0"
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { sendWhatsApp }  from '@/lib/whatsapp'

const schema = z.object({
  order_id:   z.string().uuid(),
  courier_id: z.string().uuid(),
  response:   z.enum(['accepted', 'rejected']),
})

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 422 })
    }

    const { order_id, courier_id, response } = parsed.data

    // Update the most recent dispatch_log entry for this courier+order
    const { error } = await supabaseAdmin
      .from('dispatch_log')
      .update({
        result:       response,
        responded_at: new Date().toISOString(),
      })
      .eq('order_id',   order_id)
      .eq('courier_id', courier_id)
      .in('result', ['timeout'])  // only update if still pending (timeout = not yet responded)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (response === 'rejected') {
      // Release courier back to online
      await supabaseAdmin
        .from('couriers')
        .update({ status: 'online' })
        .eq('id', courier_id)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
