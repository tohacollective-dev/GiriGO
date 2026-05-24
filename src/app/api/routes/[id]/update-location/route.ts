// =============================================================================
// PUT /api/routes/:id/update-location
// Real-time GPS update — writes to courier_active_routes AND couriers table
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { z }                         from 'zod'
import { supabaseAdmin }             from '@/lib/supabase'

const schema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body   = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'lat and lng are required numbers' }, { status: 422 })
    }

    const { lat, lng } = parsed.data
    const now          = new Date().toISOString()

    // Fetch route to get courier_id
    const { data: route, error: rErr } = await supabaseAdmin
      .from('courier_active_routes')
      .select('id, courier_id, status')
      .eq('id', params.id)
      .single()

    if (rErr || !route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 })
    }

    if (route.status === 'completed') {
      return NextResponse.json({ error: 'Route already completed' }, { status: 409 })
    }

    // Update route current_location
    await supabaseAdmin
      .from('courier_active_routes')
      .update({
        current_location: { lat, lng, updated_at: now },
        status:           'active',
      })
      .eq('id', params.id)

    // Mirror to couriers table for map compatibility
    await supabaseAdmin
      .from('couriers')
      .update({ current_lat: lat, current_lng: lng, location_updated: now })
      .eq('id', route.courier_id)

    return NextResponse.json({ ok: true, lat, lng, updated_at: now })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
