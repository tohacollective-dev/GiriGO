// =============================================================================
// Auto-dispatch engine — finds and assigns best available courier
// =============================================================================

import { supabaseAdmin } from '@/lib/supabase'
import { sendWhatsApp }  from '@/lib/whatsapp'
import { haversineKm }   from '@/lib/maps'
import { formatIDR }     from '@/lib/pricing'
import type { Courier, Order, CourierScore } from '@/types'

const APP_URL             = process.env.NEXT_PUBLIC_APP_URL ?? 'https://girigocourier.vercel.app'
const FRESHNESS_MINUTES   = 5
const ADMIN_PHONE         = process.env.ADMIN_WHATSAPP_NUMBER ?? ''

// ── Types ────────────────────────────────────────────────────────────────────

interface AutoDispatchResult {
  assigned: boolean
  courier?:  Courier & { user: { name: string; phone: string } }
  error?:    string
  logId?:    string
}

// ── Main: auto-assign courier to an order ────────────────────────────────────
export async function autoAssignCourier(orderId: string): Promise<AutoDispatchResult> {
  // 1. Fetch the order
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('*, customer:users!customer_id(name, phone)')
    .eq('id', orderId)
    .single()

  if (orderErr || !order) return { assigned: false, error: 'Order not found' }
  if (order.status !== 'pending') return { assigned: false, error: 'Order already assigned' }

  // 2. Find available couriers with recent location
  const cutoff = new Date(Date.now() - FRESHNESS_MINUTES * 60_000).toISOString()

  const { data: couriers, error: courierErr } = await supabaseAdmin
    .from('couriers')
    .select('*, user:users!user_id(name, phone)')
    .in('status', ['online', 'available'])
    .gte('last_seen_at', cutoff)
    .order('last_seen_at', { ascending: false })

  if (courierErr || !couriers?.length) {
    // No couriers available — notify admin
    await notifyAdminNoCourier(order as Order)
    return { assigned: false, error: 'No couriers available' }
  }

  // 3. Score each courier: lower score = better
  const scored = couriers
    .filter(c => c.current_lat != null && c.current_lng != null)
    .map(c => {
      const distance   = haversineKm(c.current_lat!, c.current_lng!, order.pickup_lat ?? 0, order.pickup_lng ?? 0)
      const activeCount= (c as any).active_orders ?? c.total_orders ?? 0
      const score      = (distance * 0.7) + (activeCount * 0.3)
      return { ...c, distance_km: distance, total_score: score } as Courier & { distance_km: number; total_score: number }
    })
    .sort((a, b) => a.total_score - b.total_score)

  if (!scored.length) {
    await notifyAdminNoCourier(order as Order)
    return { assigned: false, error: 'No couriers with GPS data' }
  }

  const best = scored[0]

  // 4. Auto-assign
  const { error: assignErr } = await supabaseAdmin
    .from('orders')
    .update({
      courier_id:   best.id,
      status:       'assigned',
      assigned_at:  new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('status', 'pending') // atomic: only assign if still pending

  if (assignErr) {
    return { assigned: false, error: `Assignment failed: ${assignErr.message}` }
  }

  // 5. Update courier active_orders count
  await supabaseAdmin
    .from('couriers')
    .update({ status: 'available' })
    .eq('id', best.id)

  // 6. Log dispatch
  const { data: logEntry } = await supabaseAdmin
    .from('dispatch_log')
    .insert({
      order_id:      orderId,
      courier_id:    best.id,
      attempt:       1,
      score:         best.total_score,
      distance_km:   best.distance_km,
      dispatch_type: 'auto',
      result:        'accepted',
      offered_at:    new Date().toISOString(),
      responded_at:  new Date().toISOString(),
    })
    .select()
    .single()

  // 7. Send WhatsApp notifications
  const customerPhone = (order.customer as any)?.phone as string | undefined
  const customerName  = (order.customer as any)?.name  as string | undefined
  const courierName   = best.user?.name  ?? 'Kurir'
  const courierPhone  = best.user?.phone ?? ''

  await Promise.allSettled([
    sendWhatsApp(
      best.user?.phone ?? '',
      buildCourierMessage(order as Order, customerName ?? 'Customer', customerPhone ?? ''),
    ),
    sendWhatsApp(
      customerPhone ?? '',
      buildCustomerMessage(order as Order, courierName, courierPhone),
    ),
  ])

  return {
    assigned: true,
    courier:  best as any,
    logId:    logEntry?.id,
  }
}

// ── Notify admin when no couriers available ──────────────────────────────────
async function notifyAdminNoCourier(order: Order) {
  if (!ADMIN_PHONE) return
  await sendWhatsApp(ADMIN_PHONE, [
    `⚠️ *Auto-Dispatch Failed*`,
    ``,
    `📦 ${order.order_code}`,
    `📍 ${order.pickup_address} → ${order.dropoff_address}`,
    ``,
    `No couriers available. Please assign manually.`,
    `${APP_URL}/admin/orders`,
  ].join('\n'))
}

// ── WhatsApp: notifikasi ke kurir ────────────────────────────────────────────
function buildCourierMessage(
  order: Order,
  customerName: string,
  customerPhone: string,
): string {
  return [
    `🛵 *New Assignment — Auto-Dispatch*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📦 ${order.order_code}`,
    `📍 Jemput: ${order.pickup_address}`,
    `🏠 Antar:  ${order.dropoff_address}`,
    ``,
    `👤 Customer: ${customerName}`,
    `📱 Telp: ${customerPhone.replace(/^62/, '0')}`,
    ``,
    `📏 Jarak: ${order.distance_km} km`,
    `💵 Ongkir: ${formatIDR(order.delivery_fee)}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `Balas *1* = ✅ Terima`,
    `Balas *0* = ❌ Tolak`,
    ``,
    `🔗 ${APP_URL}/tracking/${order.order_code}`,
  ].join('\n')
}

// ── WhatsApp: notifikasi ke customer ─────────────────────────────────────────
function buildCustomerMessage(
  order: Order,
  courierName: string,
  courierPhone: string,
): string {
  return [
    `📦 *Kurir Telah Diassign — GiriGo*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📦 ${order.order_code}`,
    ``,
    `🛵 Kurir: *${courierName}*`,
    `📱 Telp: ${courierPhone.replace(/^62/, '0')}`,
    ``,
    `📍 ${order.pickup_address} → ${order.dropoff_address}`,
    `💵 Ongkir: ${formatIDR(order.delivery_fee)}`,
    ``,
    `🔗 *Live Tracking:*`,
    `${APP_URL}/tracking/${order.order_code}`,
  ].join('\n')
}
