import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/api-auth'

const KEY = 'signage'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { data, error } = await supabaseAdmin
    .from('system_settings')
    .select('value, updated_at')
    .eq('key', KEY)
    .single()

  if (error || !data) {
    return NextResponse.json({ active: false, updated_at: null })
  }

  return NextResponse.json({
    active:     Boolean(data.value?.active),
    updated_at: data.updated_at,
  })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof (body as any)?.active !== 'boolean') {
    return NextResponse.json({ error: 'Field "active" must be boolean' }, { status: 400 })
  }

  const active: boolean = (body as any).active

  const { data, error } = await supabaseAdmin
    .from('system_settings')
    .upsert({
      key:        KEY,
      value:      { active, activated_at: active ? new Date().toISOString() : null },
      updated_by: 'admin',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' })
    .select('value, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    active:     Boolean(data.value?.active),
    updated_at: data.updated_at,
  })
}
