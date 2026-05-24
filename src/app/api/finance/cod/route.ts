// =============================================================================
// GET  /api/finance/cod — COD reconciliation grouped by courier
// POST /api/finance/cod — Mark orders as settled
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// ---------------------------------------------------------------------------
// GET — COD totals per courier
// ---------------------------------------------------------------------------
export async function GET(_req: NextRequest) {
  // Fetch all delivered COD orders, joining courier + user name
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      courier_id,
      package_value,
      payment_method,
      status,
      couriers:courier_id (
        id,
        users:user_id ( name )
      )
    `)
    .eq('status', 'delivered')
    .eq('payment_method', 'cod')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch payout_status per order from ledger (best-effort — may not exist)
  const orderIds = (orders ?? []).map(o => o.id)
  let payoutMap: Record<string, string> = {}

  if (orderIds.length > 0) {
    const { data: ledgerRows } = await supabaseAdmin
      .from('ledger')
      .select('order_id, payout_status')
      .in('order_id', orderIds)

    if (ledgerRows) {
      for (const l of ledgerRows) {
        payoutMap[l.order_id] = l.payout_status ?? 'unpaid'
      }
    }
  }

  // Group by courier_id
  const courierMap: Record<
    string,
    {
      courier_id:   string
      courier_name: string
      total_cod:    number
      settled_cod:  number
      outstanding_cod: number
      order_count:  number
    }
  > = {}

  for (const o of orders ?? []) {
    const courier     = Array.isArray(o.couriers) ? o.couriers[0] : o.couriers
    const courierUser = Array.isArray(courier?.users) ? courier?.users[0] : courier?.users
    const cId         = o.courier_id ?? 'unassigned'
    const cName       = (courierUser as any)?.name ?? 'Unknown'
    const cod         = o.package_value ?? 0
    const settled     = (payoutMap[o.id] ?? 'unpaid') === 'settled'

    if (!courierMap[cId]) {
      courierMap[cId] = {
        courier_id:      cId,
        courier_name:    cName,
        total_cod:       0,
        settled_cod:     0,
        outstanding_cod: 0,
        order_count:     0,
      }
    }

    courierMap[cId].total_cod    += cod
    courierMap[cId].order_count  += 1
    if (settled) {
      courierMap[cId].settled_cod += cod
    } else {
      courierMap[cId].outstanding_cod += cod
    }
  }

  const couriers = Object.values(courierMap).sort(
    (a, b) => b.outstanding_cod - a.outstanding_cod
  )

  return NextResponse.json({ couriers })
}

// ---------------------------------------------------------------------------
// POST — Mark order_ids as settled in ledger
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  let body: { order_ids?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { order_ids } = body
  if (!Array.isArray(order_ids) || order_ids.length === 0) {
    return NextResponse.json({ error: 'order_ids must be a non-empty array' }, { status: 400 })
  }

  // Attempt to update ledger table first
  const { error: ledgerError } = await supabaseAdmin
    .from('ledger')
    .update({ payout_status: 'settled', settled_at: new Date().toISOString() })
    .in('order_id', order_ids)

  if (ledgerError) {
    // ledger table may not exist — that's acceptable, return partial success
    return NextResponse.json({
      updated: 0,
      warning: 'ledger table not found — payout_status not persisted',
    })
  }

  return NextResponse.json({ updated: order_ids.length, status: 'settled' })
}
