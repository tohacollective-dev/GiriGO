// =============================================================================
// GiriGo — Dispatch Engine
// Scoring: Distance (40pts) + Workload (30pts) + Rating (30pts) = 100pts max
// Cascade: offer Courier#1 → 60s → offer Courier#2 → 60s → Courier#3 → Admin Alert
// =============================================================================

import { supabaseAdmin } from '@/lib/supabase'
import { haversineKm }   from '@/lib/maps'
import { sendWhatsApp }  from '@/lib/whatsapp'
import type { Courier, CourierScore, Order } from '@/types'

const TIMEOUT_MS      = Number(process.env.DISPATCH_TIMEOUT_SECONDS ?? 60) * 1000
const MAX_ATTEMPTS    = Number(process.env.DISPATCH_MAX_ATTEMPTS    ?? 3)
const RADIUS_KM       = Number(process.env.DISPATCH_RADIUS_KM       ?? 5)
const ADMIN_PHONE     = process.env.ADMIN_WHATSAPP_NUMBER!

// ── Scoring algorithm ─────────────────────────────────────────────────────────
export function scoreCourier(
  courier: Omit<Courier, 'user'> & { user: { name: string; phone: string } },
  pickupLat: number,
  pickupLng: number,
  activeOrders: number
): CourierScore {
  // 1. Distance score (max 40)
  const distKm = haversineKm(
    pickupLat, pickupLng,
    courier.current_lat ?? 0,
    courier.current_lng ?? 0
  )
  const dist_score = distKm > RADIUS_KM ? 0 : Math.max(0, 40 - (distKm * 8))

  // 2. Workload score (max 30) — 0 active = 30pts, 3+ = 0pts
  const workload_score = Math.max(0, 30 - (activeOrders * 10))

  // 3. Rating score (max 30)
  const rating_score = (courier.rating ?? 5.0) * 6

  return {
    courier_id:     courier.id,
    courier:        courier as any,
    total_score:    dist_score + workload_score + rating_score,
    dist_score,
    workload_score,
    rating_score,
    distance_km:    Math.round(distKm * 100) / 100,
  }
}

// ── Fetch online couriers with active order counts ────────────────────────────
async function getEligibleCouriers(pickupLat: number, pickupLng: number): Promise<CourierScore[]> {
  const { data: couriers, error } = await supabaseAdmin
    .from('couriers')
    .select('*, user:users(name, phone)')
    .eq('status', 'online')
    .not('current_lat', 'is', null)
    .not('current_lng', 'is', null)

  if (error) throw new Error(`Failed to fetch couriers: ${error.message}`)
  if (!couriers?.length) return []

  // Get active order counts per courier
  const { data: activeCounts } = await supabaseAdmin
    .from('orders')
    .select('courier_id')
    .in('status', ['assigned', 'picked_up'])

  const activeMap: Record<string, number> = {}
  for (const row of activeCounts ?? []) {
    if (row.courier_id) activeMap[row.courier_id] = (activeMap[row.courier_id] ?? 0) + 1
  }

  return couriers
    .map(c => scoreCourier(c as any, pickupLat, pickupLng, activeMap[c.id] ?? 0))
    .filter(s => s.total_score > 0)
    .sort((a, b) => b.total_score - a.total_score)
}

// ── Build courier job notification message ─────────────────────────────────────
function buildCourierJobMessage(order: Order, score: CourierScore): string {
  const earning = Math.floor(order.delivery_fee * 0.85)
  const navPickup  = `https://www.google.com/maps/dir/?api=1&destination=${order.pickup_lat},${order.pickup_lng}`
  const navDropoff = `https://www.google.com/maps/dir/?api=1&destination=${order.dropoff_lat},${order.dropoff_lng}`

  return [
    `🚚 *GiriGo — Order Baru!*`,
    `━━━━━━━━━━━━━━━━`,
    `📦 Order: *${order.order_code}*`,
    `📍 Pickup: ${order.pickup_address}`,
    `🏠 Tujuan: ${order.dropoff_address}`,
    `📏 Jarak: ${order.distance_km ?? score.distance_km} km`,
    `💵 Penghasilan: *Rp ${earning.toLocaleString('id-ID')}*`,
    `💳 Bayar: ${order.payment_method.toUpperCase()}`,
    `━━━━━━━━━━━━━━━━`,
    `🗺️ Navigasi Pickup:`,
    navPickup,
    ``,
    `🗺️ Navigasi Tujuan:`,
    navDropoff,
    `━━━━━━━━━━━━━━━━`,
    `Balas *1* = ✅ Terima`,
    `Balas *0* = ❌ Tolak`,
    ``,
    `_⏰ Harap balas dalam 60 detik_`,
  ].join('\n')
}

// ── Admin alert message ───────────────────────────────────────────────────────
function buildAdminAlert(order: Order): string {
  return [
    `⚠️ *GiriGo Admin Alert*`,
    `━━━━━━━━━━━━━━━━`,
    `❗ Order *${order.order_code}* GAGAL di-dispatch`,
    `3 kurir ditawarkan, tidak ada yang menerima.`,
    ``,
    `📍 Pickup: ${order.pickup_address}`,
    `🏠 Tujuan: ${order.dropoff_address}`,
    `💰 Ongkir: Rp ${order.delivery_fee.toLocaleString('id-ID')}`,
    ``,
    `Silakan assign manual di dashboard.`,
    `━━━━━━━━━━━━━━━━`,
    `_${new Date().toLocaleString('id-ID')}_`,
  ].join('\n')
}

// ── Offer job to courier, wait for response ────────────────────────────────────
async function offerWithTimeout(
  order: Order,
  score: CourierScore,
  attempt: number
): Promise<boolean> {
  // Log dispatch attempt
  await supabaseAdmin.from('dispatch_log').insert({
    order_id:   order.id,
    courier_id: score.courier_id,
    attempt,
    score:      score.total_score,
    result:     'timeout',  // will be updated on response
    offered_at: new Date().toISOString(),
  })

  // Send WA message to courier
  const msg = buildCourierJobMessage(order, score)
  const courierPhone = (score.courier as any).user.phone
  await sendWhatsApp(courierPhone, msg)

  // Poll for courier response (accept/reject written to DB by webhook)
  const pollStart = Date.now()
  while (Date.now() - pollStart < TIMEOUT_MS) {
    await new Promise(r => setTimeout(r, 3000))  // poll every 3 seconds

    const { data: log } = await supabaseAdmin
      .from('dispatch_log')
      .select('result')
      .eq('order_id', order.id)
      .eq('courier_id', score.courier_id)
      .eq('attempt', attempt)
      .single()

    if (log?.result === 'accepted') return true
    if (log?.result === 'rejected') return false
  }

  // Timeout — update log
  await supabaseAdmin
    .from('dispatch_log')
    .update({ result: 'timeout', responded_at: new Date().toISOString() })
    .eq('order_id', order.id)
    .eq('courier_id', score.courier_id)
    .eq('attempt', attempt)

  return false
}

// ── Main dispatch orchestrator ─────────────────────────────────────────────────
export async function dispatchOrder(orderId: string): Promise<void> {
  // Fetch the order
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderErr || !order) throw new Error(`Order not found: ${orderId}`)
  if (order.status !== 'pending') return  // already handled

  const pickupLat = order.pickup_lat ?? 0
  const pickupLng = order.pickup_lng ?? 0

  const candidates = await getEligibleCouriers(pickupLat, pickupLng)

  if (!candidates.length) {
    await sendWhatsApp(ADMIN_PHONE, buildAdminAlert(order))
    await supabaseAdmin
      .from('dispatch_log')
      .insert({ order_id: order.id, result: 'admin_alert', attempt: 1 })
    return
  }

  for (let i = 0; i < Math.min(MAX_ATTEMPTS, candidates.length); i++) {
    const score   = candidates[i]
    const attempt = i + 1

    // Mark courier busy during offer window
    await supabaseAdmin
      .from('couriers')
      .update({ status: 'busy' })
      .eq('id', score.courier_id)

    const accepted = await offerWithTimeout(order, score, attempt)

    if (accepted) {
      // Assign order
      await supabaseAdmin
        .from('orders')
        .update({
          courier_id:  score.courier_id,
          status:      'assigned',
          assigned_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      // Notify customer
      const { data: customer } = await supabaseAdmin
        .from('users')
        .select('phone, name')
        .eq('id', order.customer_id)
        .single()

      if (customer) {
        const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? 'https://girigocourier.vercel.app'
        const courierName = (score.courier as any).user.name
        await sendWhatsApp(customer.phone, [
          `✅ *Kurir GiriGo Ditemukan!*`,
          ``,
          `📦 Order: *${order.order_code}*`,
          `🧑 Kurir: ${courierName}`,
          `📍 Sedang menuju lokasi jemput`,
          ``,
          `🔗 Live tracking:`,
          `${appUrl}/tracking/${order.order_code}`,
          ``,
          `_Kurir akan menghubungi jika diperlukan_`,
        ].join('\n'))
      }

      return
    } else {
      // Release courier back to online
      await supabaseAdmin
        .from('couriers')
        .update({ status: 'online' })
        .eq('id', score.courier_id)
    }
  }

  // All attempts exhausted — admin alert
  await sendWhatsApp(ADMIN_PHONE, buildAdminAlert(order))
  await supabaseAdmin.from('dispatch_log').insert({
    order_id: order.id,
    result:   'admin_alert',
    attempt:  MAX_ATTEMPTS + 1,
  })
}
