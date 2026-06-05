// =============================================================================
// GET  /api/admin/settings  — List all system settings
// PATCH /api/admin/settings — Update a setting value
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { data, error } = await supabaseAdmin
    .from('system_settings')
    .select('*')
    .order('key')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ settings: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  let body: { key?: string; value?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.key || typeof body.key !== 'string') {
    return NextResponse.json({ error: 'Field "key" is required' }, { status: 400 })
  }

  if (body.value === undefined) {
    return NextResponse.json({ error: 'Field "value" is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('system_settings')
    .upsert({
      key:        body.key,
      value:      body.value,
      updated_by: auth.email,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ setting: data })
}
