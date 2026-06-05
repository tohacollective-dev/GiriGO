// =============================================================================
// GET /api/admin/logs — Activity log viewer (dispatch attempts + results)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { searchParams } = req.nextUrl
  const result = searchParams.get('result')
  const limit   = Math.min(Number(searchParams.get('limit') ?? 200), 500)
  const page    = Math.max(Number(searchParams.get('page')  ?? 1), 1)
  const from    = (page - 1) * limit
  const to      = from + limit - 1

  let query = supabaseAdmin
    .from('dispatch_log')
    .select('*, order:orders(order_code), courier:couriers(user:users(name))', { count: 'exact' })
    .order('offered_at', { ascending: false })
    .range(from, to)

  if (result && ['accepted', 'rejected', 'timeout', 'admin_alert'].includes(result)) {
    query = query.eq('result', result)
  }

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data: data ?? [],
    count: count ?? 0,
    page,
    limit,
    total_pages: count ? Math.ceil(count / limit) : 0,
  })
}
