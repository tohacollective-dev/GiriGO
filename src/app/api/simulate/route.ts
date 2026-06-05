// =============================================================================
// POST /api/simulate — Full-flow order simulation (dev/demo only)
//
// Actions:
//   setup_courier   — create a test courier + user with GPS near Giri Menang Sq
//   create_order    — create a test customer + order with pre-set addresses
//   accept_order    — simulate courier accepting the dispatch offer
//   pickup_order    — simulate courier confirming pickup
//   deliver_order   — simulate courier marking delivered
//   cleanup         — delete all [SIM] prefixed test data
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { calculatePrice } from '@/lib/pricing'
import { haversineKm } from '@/lib/maps'

// Fixed Gerung simulation coordinates
const SIM_LOCATIONS = {
  courier:  { lat: -8.6490, lng: 116.1195, label: 'Giri Menang Square Area' },
  pickup:   { lat: -8.6508, lng: 116.1220, label: 'Jl. Sriwijaya No. 12, Gerung' },
  dropoff:  { lat: -8.6620, lng: 116.1350, label: 'Jl. Raya Karang Bongkot No. 5' },
}

// Prefix used to identify simulation records for cleanup
const SIM_PREFIX = '[SIM]'

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Simulation is only available in development' },
      { status: 403 },
    )
  }

  try {
    const { action, order_id, courier_id } = await req.json()

    switch (action) {

      // ── 1. Create a simulation courier ─────────────────────────────────────
      case 'setup_courier': {
        // Generate a unique phone so UNIQUE constraint doesn't fail on re-runs
        const simPhone = '62800' + Date.now().toString().slice(-8)

        const { data: user, error: uErr } = await supabaseAdmin
          .from('users')
          .insert({
            name:  `${SIM_PREFIX} Kurir Budi`,
            phone: simPhone,
            role:  'courier',
          })
          .select()
          .single()
        if (uErr) return err(uErr.message)

        const { data: courier, error: cErr } = await supabaseAdmin
          .from('couriers')
          .insert({
            user_id:          user.id,
            vehicle_type:     'motorcycle',
            status:           'online',
            current_lat:      SIM_LOCATIONS.courier.lat,
            current_lng:      SIM_LOCATIONS.courier.lng,
            location_updated: new Date().toISOString(),
            rating:           4.80,
          })
          .select()
          .single()
        if (cErr) return err(cErr.message)

        return NextResponse.json({
          ok:         true,
          courier_id: courier.id,
          user_id:    user.id,
          message:    `Kurir simulasi "${user.name}" dibuat dan sedang Online di ${SIM_LOCATIONS.courier.label}`,
        })
      }

      // ── 2. Create a simulation order ────────────────────────────────────────
      case 'create_order': {
        const simPhone = '62811' + Date.now().toString().slice(-8)

        const { data: customer, error: cuErr } = await supabaseAdmin
          .from('users')
          .insert({
            name:  `${SIM_PREFIX} Customer Dewi`,
            phone: simPhone,
            role:  'customer',
          })
          .select()
          .single()
        if (cuErr) return err(cuErr.message)

        const distKm  = haversineKm(
          SIM_LOCATIONS.pickup.lat,  SIM_LOCATIONS.pickup.lng,
          SIM_LOCATIONS.dropoff.lat, SIM_LOCATIONS.dropoff.lng,
        )
        const pricing = calculatePrice(distKm, 1.5)

        const { data: order, error: oErr } = await supabaseAdmin
          .from('orders')
          .insert({
            customer_id:      customer.id,
            pickup_address:   SIM_LOCATIONS.pickup.label,
            pickup_lat:       SIM_LOCATIONS.pickup.lat,
            pickup_lng:       SIM_LOCATIONS.pickup.lng,
            dropoff_address:  SIM_LOCATIONS.dropoff.label,
            dropoff_lat:      SIM_LOCATIONS.dropoff.lat,
            dropoff_lng:      SIM_LOCATIONS.dropoff.lng,
            item_type:        'Makanan & Minuman',
            item_weight_kg:   1.5,
            distance_km:      Math.round(distKm * 100) / 100,
            base_fee:         pricing.base_fee,
            weight_surcharge: pricing.weight_surcharge,
            delivery_fee:     pricing.delivery_fee,
            package_value:    0,
            payment_method:   'cod',
            status:           'pending',
            notes:            `${SIM_PREFIX} Order demo untuk testing`,
          })
          .select()
          .single()
        if (oErr) return err(oErr.message)

        return NextResponse.json({
          ok:          true,
          order_id:    order.id,
          order_code:  order.order_code,
          customer_id: customer.id,
          pricing,
          distance_km: Math.round(distKm * 100) / 100,
          pickup:      SIM_LOCATIONS.pickup.label,
          dropoff:     SIM_LOCATIONS.dropoff.label,
          message:     `Order ${order.order_code} dibuat — Rp ${pricing.delivery_fee.toLocaleString('id-ID')} (${Math.round(distKm * 100) / 100} km, COD)`,
        })
      }

      // ── 3. Simulate courier accepting ───────────────────────────────────────
      case 'accept_order': {
        if (!order_id || !courier_id) return err('order_id and courier_id required')

        const { data: order, error: oErr } = await supabaseAdmin
          .from('orders')
          .update({
            status:      'assigned',
            courier_id,
            assigned_at: new Date().toISOString(),
          })
          .eq('id', order_id)
          .select('order_code')
          .single()
        if (oErr) return err(oErr.message)

        // Set courier to busy
        await supabaseAdmin
          .from('couriers')
          .update({ status: 'busy' })
          .eq('id', courier_id)

        return NextResponse.json({
          ok:      true,
          message: `✅ Kurir menerima order ${order.order_code} — status: ASSIGNED`,
        })
      }

      // ── 4. Simulate courier picking up ──────────────────────────────────────
      case 'pickup_order': {
        if (!order_id) return err('order_id required')

        const { data: order, error: oErr } = await supabaseAdmin
          .from('orders')
          .update({
            status:       'picked_up',
            picked_up_at: new Date().toISOString(),
          })
          .eq('id', order_id)
          .select('order_code')
          .single()
        if (oErr) return err(oErr.message)

        // Move courier GPS to midpoint between pickup and dropoff
        if (courier_id) {
          await supabaseAdmin
            .from('couriers')
            .update({
              current_lat:      (SIM_LOCATIONS.pickup.lat + SIM_LOCATIONS.dropoff.lat) / 2,
              current_lng:      (SIM_LOCATIONS.pickup.lng + SIM_LOCATIONS.dropoff.lng) / 2,
              location_updated: new Date().toISOString(),
            })
            .eq('id', courier_id)
        }

        return NextResponse.json({
          ok:      true,
          message: `📦 Barang dijemput — order ${order.order_code} status: PICKED_UP. Kurir bergerak ke tujuan.`,
        })
      }

      // ── 5. Simulate delivery ────────────────────────────────────────────────
      case 'deliver_order': {
        if (!order_id) return err('order_id required')

        const { data: order, error: oErr } = await supabaseAdmin
          .from('orders')
          .update({
            status:       'delivered',
            delivered_at: new Date().toISOString(),
          })
          .eq('id', order_id)
          .select('order_code, delivery_fee')
          .single()
        if (oErr) return err(oErr.message)

        // Return courier to online at dropoff position
        if (courier_id) {
          await supabaseAdmin
            .from('couriers')
            .update({
              status:           'online',
              current_lat:      SIM_LOCATIONS.dropoff.lat,
              current_lng:      SIM_LOCATIONS.dropoff.lng,
              location_updated: new Date().toISOString(),
            })
            .eq('id', courier_id)
        }

        return NextResponse.json({
          ok:            true,
          courier_earn:  Math.round(order.delivery_fee * 0.85),
          platform_earn: Math.round(order.delivery_fee * 0.15),
          message:       `🎉 Terkirim! Order ${order.order_code} selesai. Ledger 85/15 dibuat otomatis oleh DB trigger.`,
        })
      }

      // ── 6. Cleanup ──────────────────────────────────────────────────────────
      case 'cleanup': {
        // Find all sim users by name prefix
        const { data: simUsers } = await supabaseAdmin
          .from('users')
          .select('id, role')
          .like('name', `${SIM_PREFIX}%`)

        if (!simUsers || simUsers.length === 0) {
          return NextResponse.json({ ok: true, message: 'Tidak ada data simulasi untuk dihapus.' })
        }

        const simUserIds     = simUsers.map(u => u.id)
        const simCourierUsers = simUsers.filter(u => u.role === 'courier').map(u => u.id)

        // Find courier IDs for sim couriers
        let simCourierIds: string[] = []
        if (simCourierUsers.length > 0) {
          const { data: simCouriers } = await supabaseAdmin
            .from('couriers')
            .select('id')
            .in('user_id', simCourierUsers)
          simCourierIds = (simCouriers ?? []).map(c => c.id)
        }

        // Delete orders linked to sim couriers or sim customers
        const customerIds = simUsers.filter(u => u.role === 'customer').map(u => u.id)
        if (customerIds.length > 0) {
          await supabaseAdmin.from('orders').delete().in('customer_id', customerIds)
        }
        if (simCourierIds.length > 0) {
          await supabaseAdmin.from('orders').delete().in('courier_id', simCourierIds)
          await supabaseAdmin.from('couriers').delete().in('id', simCourierIds)
        }
        await supabaseAdmin.from('users').delete().in('id', simUserIds)

        return NextResponse.json({
          ok:      true,
          removed: simUserIds.length,
          message: `🧹 ${simUserIds.length} akun simulasi dan semua order terkait telah dihapus.`,
        })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

function err(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 })
}
