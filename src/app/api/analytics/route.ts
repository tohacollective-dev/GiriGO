// =============================================================================
// GET /api/analytics — Dashboard analytics summary
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(_req: NextRequest) {
  const [summary, couriers, topZones] = await Promise.all([
    // Daily summary (last 30 days)
    supabaseAdmin
      .from('v_daily_summary')
      .select('*')
      .limit(30),

    // Courier leaderboard
    supabaseAdmin
      .from('v_courier_leaderboard')
      .select('*')
      .limit(10),

    // Top dropoff zones
    supabaseAdmin
      .from('orders')
      .select('dropoff_address')
      .eq('status', 'delivered')
      .limit(500),
  ])

  // Compute top zones from dropoff addresses
  const zoneCount: Record<string, number> = {}
  for (const row of topZones.data ?? []) {
    const zone = row.dropoff_address?.split(',')[0]?.trim() ?? 'Unknown'
    zoneCount[zone] = (zoneCount[zone] ?? 0) + 1
  }
  const topZonesList = Object.entries(zoneCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([zone, count]) => ({ zone, count }))

  // Overall stats
  const allSummary = summary.data ?? []
  const totalOrders   = allSummary.reduce((s, r) => s + (r.total_orders ?? 0), 0)
  const totalDelivered = allSummary.reduce((s, r) => s + (r.delivered    ?? 0), 0)
  const totalRevenue  = allSummary.reduce((s, r) => s + (r.gross_revenue ?? 0), 0)

  return NextResponse.json({
    overview: {
      total_orders:    totalOrders,
      total_delivered: totalDelivered,
      gross_revenue:   totalRevenue,
      platform_revenue: Math.ceil(totalRevenue * 0.15),
      success_rate:    totalOrders > 0
        ? Math.round(totalDelivered * 100 / totalOrders)
        : 0,
    },
    daily:      allSummary,
    couriers:   couriers.data ?? [],
    top_zones:  topZonesList,
  })
}
