// =============================================================================
// GET /api/courier/earnings — Courier's personal earnings + stats
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { authenticateRequest } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  // Try session auth first, fall back to courier_id query param
  let courierId: string | null = null

  const result = await authenticateRequest(req)
  if (result) {
    const { data: courier } = await supabaseAdmin
      .from('couriers')
      .select('id')
      .eq('auth_id', result.user.id)
      .single()
    courierId = courier?.id ?? null
  }

  // Fallback: courier_id query param (localStorage-based PWA)
  if (!courierId) {
    courierId = req.nextUrl.searchParams.get('courier_id')
  }

  if (!courierId) {
    return NextResponse.json({ error: 'Courier not found' }, { status: 404 })
  }

  const { data: courier, error } = await supabaseAdmin
    .from('couriers')
    .select('total_earnings, total_orders, completed_orders, active_orders, rating, status')
    .eq('id', courierId)
    .single()

  if (error || !courier) {
    return NextResponse.json({ error: 'Courier not found' }, { status: 404 })
  }

  // Get today's earnings from orders
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data: todayOrders } = await supabaseAdmin
    .from('orders')
    .select('delivery_fee')
    .eq('courier_id', courierId)
    .eq('status', 'delivered')
    .gte('delivered_at', todayStart.toISOString())

  const todayEarnings = (todayOrders ?? []).reduce((s, o) => s + (o.delivery_fee ?? 0), 0)

  return NextResponse.json({
    total_earnings:   courier.total_earnings ?? 0,
    total_orders:     courier.total_orders   ?? 0,
    completed_orders: courier.completed_orders ?? 0,
    active_orders:    courier.active_orders  ?? 0,
    rating:           courier.rating         ?? 0,
    status:           courier.status,
    today_earnings:   todayEarnings,
    courier_share_today: Math.floor(todayEarnings * 0.85),
  })
}
