import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/api-auth'

export async function GET(request: Request) {
  const req = request as unknown as import('next/server').NextRequest
  const auth = await requireAuth(req as any)
  if (auth instanceof Response) return auth

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limit  = parseInt(searchParams.get('limit') ?? '100', 10)

  let query = supabaseAdmin
    .from('couriers')
    .select(`
      *,
      user:users!couriers_user_id_fkey (name, phone)
    `)
    .order('total_orders', { ascending: false })
    .limit(limit)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, count: data?.length ?? 0 })
}
