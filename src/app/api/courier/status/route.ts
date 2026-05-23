// =============================================================================
// PATCH /api/courier/status — Update courier online/offline + location
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'

const schema = z.object({
  courier_id: z.string().uuid(),
  status:     z.enum(['online', 'offline', 'busy']),
  lat:        z.number().min(-90).max(90).optional(),
  lng:        z.number().min(-180).max(180).optional(),
})

export async function PATCH(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 422 })

    const { courier_id, status, lat, lng } = parsed.data

    const update: Record<string, unknown> = { status }
    if (lat !== undefined && lng !== undefined) {
      update.current_lat       = lat
      update.current_lng       = lng
      update.location_updated  = new Date().toISOString()
    }

    const { error } = await supabaseAdmin
      .from('couriers')
      .update(update)
      .eq('id', courier_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
