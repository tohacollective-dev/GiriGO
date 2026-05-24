// =============================================================================
// GET /api/finance/ledger — Ledger summary + row list
// Derives data from orders + ledger table (falls back to orders-only if no ledger)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const COURIER_SHARE_PCT = 0.85

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  // Default to today (Jakarta time, UTC+8)
  const dateParam = searchParams.get('date') ?? new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10)

  // Date window: full day in UTC (Indonesia is UTC+8, so shift accordingly)
  const dayStart = `${dateParam}T00:00:00+08:00`
  const dayEnd   = `${dateParam}T23:59:59+08:00`

  // ------------------------------------------------------------------
  // 1. Fetch delivered orders for the date, joining courier + user
  // ------------------------------------------------------------------
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      order_code,
      delivery_fee,
      payment_method,
      package_value,
      courier_id,
      created_at,
      couriers:courier_id (
        id,
        users:user_id ( name )
      )
    `)
    .eq('status', 'delivered')
    .gte('created_at', dayStart)
    .lte('created_at', dayEnd)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ------------------------------------------------------------------
  // 2. Attempt to fetch payout_status from ledger table.
  //    If table doesn't exist the query will error — we fall back to 'unpaid'.
  // ------------------------------------------------------------------
  let ledgerMap: Record<string, { cod_collected: number; payout_status: string }> = {}

  const { data: ledgerRows } = await supabaseAdmin
    .from('ledger')
    .select('order_id, cod_collected, payout_status')
    .in('order_id', (orders ?? []).map(o => o.id))

  if (ledgerRows) {
    for (const l of ledgerRows) {
      ledgerMap[l.order_id] = {
        cod_collected: l.cod_collected ?? 0,
        payout_status: l.payout_status ?? 'unpaid',
      }
    }
  }

  // ------------------------------------------------------------------
  // 3. Build response rows
  // ------------------------------------------------------------------
  const rows = (orders ?? []).map(o => {
    const fee            = o.delivery_fee ?? 0
    const courier_share  = Math.floor(fee * COURIER_SHARE_PCT)
    const platform_share = fee - courier_share

    const ledger       = ledgerMap[o.id]
    const payout_status = ledger?.payout_status ?? 'unpaid'

    // COD amount: ledger.cod_collected or package_value if COD order
    const cod_amount = ledger?.cod_collected
      ?? (o.payment_method === 'cod' ? (o.package_value ?? 0) : 0)

    const courier     = Array.isArray(o.couriers) ? o.couriers[0] : o.couriers
    const courierUser = Array.isArray(courier?.users) ? courier?.users[0] : courier?.users
    const courier_name = (courierUser as any)?.name ?? '—'

    return {
      order_id:      o.id,
      order_code:    o.order_code,
      created_at:    o.created_at,
      delivery_fee:  fee,
      courier_share,
      platform_share,
      cod_amount,
      payout_status,
      courier_name,
    }
  })

  // ------------------------------------------------------------------
  // 4. Compute summary
  // ------------------------------------------------------------------
  const total_fee      = rows.reduce((s, r) => s + r.delivery_fee, 0)
  const courier_share  = rows.reduce((s, r) => s + r.courier_share, 0)
  const platform_share = rows.reduce((s, r) => s + r.platform_share, 0)
  const cod_unpaid     = rows
    .filter(r => r.payout_status !== 'settled')
    .reduce((s, r) => s + r.cod_amount, 0)

  return NextResponse.json({
    date: dateParam,
    summary: { total_fee, courier_share, platform_share, cod_unpaid },
    rows,
  })
}
