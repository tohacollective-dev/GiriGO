// =============================================================================
// GiriGo — WhatsApp Bot State Machine
// States: idle → awaiting_name → awaiting_pickup → awaiting_dropoff →
//         awaiting_package_type → awaiting_payment → awaiting_confirmation →
//         order_active → awaiting_rating
// =============================================================================

import { supabaseAdmin }   from '@/lib/supabase'
import { sendWhatsApp }    from '@/lib/whatsapp'
import { geocodeAddress, getRouteDistance } from '@/lib/maps'
import { calculatePrice, normalizePhone, formatIDR } from '@/lib/pricing'
import { dispatchOrder }   from '@/lib/dispatch'
import type { WaSession, OrderContext, WhatsAppInboundMessage, SessionState } from '@/types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://girigocourier.vercel.app'

// ── Session helpers ───────────────────────────────────────────────────────────
async function getSession(phone: string): Promise<WaSession> {
  const { data } = await supabaseAdmin
    .from('wa_sessions')
    .select('*')
    .eq('phone', phone)
    .single()

  if (data) return data as WaSession

  // Create new session
  const { data: newSession } = await supabaseAdmin
    .from('wa_sessions')
    .insert({ phone, state: 'idle', context: {} })
    .select()
    .single()

  return newSession as WaSession
}

async function updateSession(
  phone: string,
  state: SessionState,
  context: Partial<OrderContext> = {}
): Promise<void> {
  await supabaseAdmin
    .from('wa_sessions')
    .update({ state, context, last_msg_at: new Date().toISOString() })
    .eq('phone', phone)
}

async function getOrCreateUser(phone: string, name?: string) {
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single()

  if (existing) return existing

  if (!name) return null

  const { data: newUser } = await supabaseAdmin
    .from('users')
    .insert({ phone, name, role: 'customer' })
    .select()
    .single()

  // Link session to user
  await supabaseAdmin
    .from('wa_sessions')
    .update({ user_id: newUser.id })
    .eq('phone', phone)

  return newUser
}

// ── Messages ──────────────────────────────────────────────────────────────────
const MSG = {
  welcome: (isNew: boolean) => isNew
    ? [
        `👋 *Halo! Selamat datang di GiriGo Courier* 🛵`,
        ``,
        `Kami siap antar paket Anda di area Gerung & Lombok Barat.`,
        ``,
        `Boleh tahu nama Anda? 😊`,
      ].join('\n')
    : [
        `👋 *Selamat datang kembali di GiriGo!* 🛵`,
        ``,
        `Ketik *ORDER* untuk pesan pengiriman baru`,
        `Ketik *STATUS* untuk cek status terakhir`,
        `Ketik *BANTUAN* untuk informasi lainnya`,
      ].join('\n'),

  askPickup: [
    `📍 *Alamat Penjemputan*`,
    ``,
    `Kirimkan alamat lengkap atau nama tempat untuk dijemput.`,
    `_Contoh: Jl. Gajah Mada No.5, Gerung_`,
  ].join('\n'),

  askDropoff: [
    `🏠 *Alamat Tujuan*`,
    ``,
    `Kirimkan alamat lengkap atau nama tempat tujuan pengiriman.`,
    `_Contoh: Jl. Sudirman No.10, Kediri_`,
  ].join('\n'),

  askPackageType: [
    `📦 *Jenis Barang*`,
    ``,
    `1 — Dokumen`,
    `2 — Makanan & Minuman`,
    `3 — Paket Kecil (<1kg)`,
    `4 — Paket Sedang (1–3kg)`,
    `5 — Paket Besar (3–5kg)`,
    `6 — Barang Lainnya`,
    ``,
    `_Balas dengan nomor pilihan Anda_`,
  ].join('\n'),

  askPayment: [
    `💳 *Metode Pembayaran*`,
    ``,
    `1 — COD (Bayar di tempat)`,
    `2 — Transfer Bank`,
    `3 — E-Wallet`,
  ].join('\n'),

  askCODValue: [
    `💰 *Nilai Barang (COD)*`,
    ``,
    `Berapa nilai barang yang akan ditagihkan kepada penerima?`,
    `_Kirim dalam angka, contoh: 150000_`,
  ].join('\n'),

  geocodingWait: `⏳ _Sedang menghitung tarif... mohon tunggu_`,

  geocodingFailed: (addr: string) => [
    `⚠️ Maaf, alamat tidak ditemukan: "${addr}"`,
    ``,
    `Coba kirim ulang dengan lebih spesifik.`,
    `_Contoh: Jl. Raya Gerung No.12, Gerung, Lombok Barat_`,
  ].join('\n'),

  quote: (ctx: OrderContext) => {
    const pricing = calculatePrice(ctx.distance_km!, ctx.item_weight_kg ?? 1)
    return [
      `✅ *Konfirmasi Order GiriGo*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📍 Jemput: ${ctx.pickup_address}`,
      `🏠 Antar:   ${ctx.dropoff_address}`,
      `📦 Barang: ${ctx.item_type}`,
      `📏 Jarak:   ${ctx.distance_km} km`,
      `⏱️  Estimasi: ~${Math.round(ctx.distance_km! * 4)} menit`,
      `💳 Bayar:   ${ctx.payment_method!.toUpperCase()}`,
      ctx.package_value ? `💰 Nilai COD: ${formatIDR(ctx.package_value)}` : null,
      `━━━━━━━━━━━━━━━━━━━━`,
      `💵 *Ongkos Kirim: ${formatIDR(pricing.delivery_fee)}*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `Balas *YA* untuk konfirmasi`,
      `Balas *BATAL* untuk membatalkan`,
    ].filter(Boolean).join('\n')
  },

  orderCreated: (orderCode: string) => [
    `🎉 *Order Dikonfirmasi!*`,
    ``,
    `📦 Order ID: *${orderCode}*`,
    ``,
    `Kami sedang mencari kurir terdekat untuk Anda...`,
    ``,
    `🔗 Live tracking:`,
    `${APP_URL}/tracking/${orderCode}`,
  ].join('\n'),

  cancelled: `❌ Order dibatalkan. Ketik *ORDER* kapan saja untuk pesan baru.`,

  askRating: (courierName: string) => [
    `⭐ *Rating Pengiriman*`,
    ``,
    `Bagaimana pengalaman Anda dengan kurir *${courierName}*?`,
    ``,
    `1 = ⭐ Sangat Buruk`,
    `2 = ⭐⭐ Buruk`,
    `3 = ⭐⭐⭐ Cukup`,
    `4 = ⭐⭐⭐⭐ Baik`,
    `5 = ⭐⭐⭐⭐⭐ Sangat Baik`,
    ``,
    `_Balas dengan angka 1–5_`,
  ].join('\n'),

  ratingThanks: (score: number) =>
    `Terima kasih atas rating ${'⭐'.repeat(score)} Anda! 🙏\n\nKetik *ORDER* untuk pesan pengiriman berikutnya.`,

  help: [
    `ℹ️ *GiriGo Courier — Bantuan*`,
    ``,
    `Perintah yang tersedia:`,
    `• *ORDER*  — Pesan pengiriman baru`,
    `• *STATUS* — Cek status order terakhir`,
    `• *BATAL*  — Batalkan order aktif`,
    `• *BANTUAN* — Tampilkan pesan ini`,
    ``,
    `📞 Hubungi admin: wa.me/${process.env.ADMIN_WHATSAPP_NUMBER}`,
  ].join('\n'),
}

const PACKAGE_TYPES: Record<string, { name: string; weight: number }> = {
  '1': { name: 'Dokumen',           weight: 0.2 },
  '2': { name: 'Makanan & Minuman', weight: 0.5 },
  '3': { name: 'Paket Kecil',       weight: 0.8 },
  '4': { name: 'Paket Sedang',      weight: 2.0 },
  '5': { name: 'Paket Besar',       weight: 4.0 },
  '6': { name: 'Barang Lainnya',    weight: 1.0 },
}

const PAYMENT_MAP: Record<string, 'cod' | 'transfer' | 'ewallet'> = {
  '1': 'cod', '2': 'transfer', '3': 'ewallet',
  'cod': 'cod', 'transfer': 'transfer', 'ewallet': 'ewallet',
}

// ── Main message handler ──────────────────────────────────────────────────────
export async function handleInboundMessage(msg: WhatsAppInboundMessage): Promise<void> {
  const phone   = normalizePhone(msg.from)
  const text    = msg.body.trim()
  const textUp  = text.toUpperCase()
  const session = await getSession(phone)
  const ctx     = session.context as OrderContext

  // Global commands (work from any state)
  if (textUp === 'BANTUAN' || textUp === 'HELP') {
    await sendWhatsApp(phone, MSG.help)
    return
  }

  if (textUp === 'BATAL' || textUp === 'CANCEL') {
    await updateSession(phone, 'idle', {})
    await sendWhatsApp(phone, MSG.cancelled)
    return
  }

  // Courier response handling (couriers reply "1" or "0" to job offers)
  if (text === '1' || text === '0') {
    const isCourier = await handleCourierResponse(phone, text)
    if (isCourier) return
  }

  switch (session.state) {
    // ── IDLE ──────────────────────────────────────────────────────────────
    case 'idle': {
      const user = await getOrCreateUser(phone)
      if (!user) {
        await updateSession(phone, 'awaiting_name')
        await sendWhatsApp(phone, MSG.welcome(true))
      } else if (textUp === 'ORDER') {
        await updateSession(phone, 'awaiting_pickup', {})
        await sendWhatsApp(phone, MSG.askPickup)
      } else if (textUp === 'STATUS') {
        await handleStatusCheck(phone, user.id)
      } else {
        await sendWhatsApp(phone, MSG.welcome(false))
      }
      break
    }

    // ── AWAITING NAME ─────────────────────────────────────────────────────
    case 'awaiting_name': {
      if (text.length < 2) {
        await sendWhatsApp(phone, `Maaf, nama terlalu pendek. Coba lagi 😊`)
        break
      }
      const user = await getOrCreateUser(phone, text)
      await updateSession(phone, 'awaiting_pickup', {})
      await sendWhatsApp(phone, [
        `Terima kasih, *${user?.name}*! 👋`,
        ``,
        MSG.askPickup,
      ].join('\n'))
      break
    }

    // ── AWAITING PICKUP ───────────────────────────────────────────────────
    case 'awaiting_pickup': {
      await sendWhatsApp(phone, MSG.geocodingWait)
      try {
        const geo = await geocodeAddress(text)
        await updateSession(phone, 'awaiting_dropoff', {
          pickup_address: geo.display_name,
          pickup_lat:     geo.lat,
          pickup_lng:     geo.lng,
        })
        await sendWhatsApp(phone, [
          `✅ Titik jemput: _${geo.display_name}_`,
          ``,
          MSG.askDropoff,
        ].join('\n'))
      } catch {
        await sendWhatsApp(phone, MSG.geocodingFailed(text))
      }
      break
    }

    // ── AWAITING DROPOFF ──────────────────────────────────────────────────
    case 'awaiting_dropoff': {
      await sendWhatsApp(phone, MSG.geocodingWait)
      try {
        const geo   = await geocodeAddress(text)
        const route = await getRouteDistance(ctx.pickup_lat!, ctx.pickup_lng!, geo.lat, geo.lng)

        await updateSession(phone, 'awaiting_package_type', {
          ...ctx,
          dropoff_address: geo.display_name,
          dropoff_lat:     geo.lat,
          dropoff_lng:     geo.lng,
          distance_km:     route.distance_km,
        })
        await sendWhatsApp(phone, [
          `✅ Tujuan: _${geo.display_name}_`,
          `📏 Jarak: ${route.distance_km} km`,
          ``,
          MSG.askPackageType,
        ].join('\n'))
      } catch {
        await sendWhatsApp(phone, MSG.geocodingFailed(text))
      }
      break
    }

    // ── AWAITING PACKAGE TYPE ─────────────────────────────────────────────
    case 'awaiting_package_type': {
      const pkg = PACKAGE_TYPES[text]
      if (!pkg) {
        await sendWhatsApp(phone, `Pilih angka 1–6 sesuai jenis barang:\n\n${MSG.askPackageType}`)
        break
      }
      await updateSession(phone, 'awaiting_payment', {
        ...ctx,
        item_type:      pkg.name,
        item_weight_kg: pkg.weight,
      })
      await sendWhatsApp(phone, MSG.askPayment)
      break
    }

    // ── AWAITING PAYMENT ──────────────────────────────────────────────────
    case 'awaiting_payment': {
      const method = PAYMENT_MAP[text.toLowerCase()]
      if (!method) {
        await sendWhatsApp(phone, `Pilih metode pembayaran:\n\n${MSG.askPayment}`)
        break
      }
      const newCtx = { ...ctx, payment_method: method, package_value: 0 }

      if (method === 'cod') {
        await updateSession(phone, 'awaiting_confirmation', newCtx)
        await sendWhatsApp(phone, MSG.askCODValue)
        // We'll intercept the COD value in awaiting_confirmation state before showing quote
        await updateSession(phone, 'awaiting_payment', { ...newCtx, payment_method: 'cod' })
        // Temporary — re-enter a sub-state for COD value
        await updateSession(phone, 'awaiting_confirmation', newCtx)
        await sendWhatsApp(phone, MSG.askCODValue)
      } else {
        await updateSession(phone, 'awaiting_confirmation', newCtx)
        await sendWhatsApp(phone, MSG.quote(newCtx))
      }
      break
    }

    // ── AWAITING CONFIRMATION ─────────────────────────────────────────────
    case 'awaiting_confirmation': {
      // If COD and no package_value yet, this message is the COD amount
      if (ctx.payment_method === 'cod' && !ctx.package_value) {
        const amount = parseInt(text.replace(/\D/g, ''), 10)
        if (isNaN(amount) || amount < 0) {
          await sendWhatsApp(phone, `Masukkan nilai barang dalam angka. Contoh: 150000`)
          break
        }
        const newCtx = { ...ctx, package_value: amount }
        await updateSession(phone, 'awaiting_confirmation', newCtx)
        await sendWhatsApp(phone, MSG.quote(newCtx))
        break
      }

      if (textUp === 'YA' || text === '1') {
        // Create order
        const user = await getOrCreateUser(phone)
        if (!user) break

        const pricing = calculatePrice(ctx.distance_km!, ctx.item_weight_kg ?? 1)

        const { data: order, error } = await supabaseAdmin
          .from('orders')
          .insert({
            customer_id:     user.id,
            pickup_address:  ctx.pickup_address!,
            pickup_lat:      ctx.pickup_lat!,
            pickup_lng:      ctx.pickup_lng!,
            dropoff_address: ctx.dropoff_address!,
            dropoff_lat:     ctx.dropoff_lat!,
            dropoff_lng:     ctx.dropoff_lng!,
            item_type:       ctx.item_type  ?? 'Paket',
            item_weight_kg:  ctx.item_weight_kg ?? 1,
            distance_km:     ctx.distance_km!,
            base_fee:        pricing.base_fee,
            weight_surcharge: pricing.weight_surcharge,
            delivery_fee:    pricing.delivery_fee,
            package_value:   ctx.package_value ?? 0,
            payment_method:  ctx.payment_method!,
            status:          'pending',
          })
          .select()
          .single()

        if (error || !order) {
          await sendWhatsApp(phone, `⚠️ Gagal membuat order. Coba lagi atau hubungi admin.`)
          break
        }

        await updateSession(phone, 'order_active', { ...ctx, order_id: order.id, order_code: order.order_code })
        await sendWhatsApp(phone, MSG.orderCreated(order.order_code))

        // Trigger dispatch asynchronously
        dispatchOrder(order.id).catch(e => console.error('[Dispatch]', e))

      } else if (textUp === 'BATAL' || text === '0') {
        await updateSession(phone, 'idle', {})
        await sendWhatsApp(phone, MSG.cancelled)
      } else {
        await sendWhatsApp(phone, `Balas *YA* untuk konfirmasi atau *BATAL* untuk membatalkan.`)
      }
      break
    }

    // ── ORDER ACTIVE ──────────────────────────────────────────────────────
    case 'order_active': {
      if (textUp === 'STATUS') {
        await handleStatusCheck(phone, (await getOrCreateUser(phone))?.id)
        break
      }
      // Check if order is delivered → ask rating
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('status, order_code, courier:couriers(user:users(name))')
        .eq('id', ctx.order_id!)
        .single()

      if (order?.status === 'delivered') {
        const courierName = (order.courier as any)?.user?.name ?? 'Kurir'
        await updateSession(phone, 'awaiting_rating')
        await sendWhatsApp(phone, MSG.askRating(courierName))
      } else {
        await sendWhatsApp(phone, [
          `📦 Order *${ctx.order_code}* sedang dalam proses.`,
          `🔗 ${APP_URL}/tracking/${ctx.order_code}`,
        ].join('\n'))
      }
      break
    }

    // ── AWAITING RATING ───────────────────────────────────────────────────
    case 'awaiting_rating': {
      const score = parseInt(text, 10)
      if (isNaN(score) || score < 1 || score > 5) {
        await sendWhatsApp(phone, `Balas dengan angka 1–5 untuk memberikan rating. ⭐`)
        break
      }
      const user = await getOrCreateUser(phone)
      if (user && ctx.order_id) {
        const { data: order } = await supabaseAdmin
          .from('orders')
          .select('courier_id')
          .eq('id', ctx.order_id)
          .single()

        if (order?.courier_id) {
          await supabaseAdmin.from('ratings').insert({
            order_id:    ctx.order_id,
            customer_id: user.id,
            courier_id:  order.courier_id,
            score,
          }).select().single()
        }
      }

      await updateSession(phone, 'idle', {})
      await sendWhatsApp(phone, MSG.ratingThanks(score))
      break
    }

    default:
      await updateSession(phone, 'idle', {})
      await sendWhatsApp(phone, MSG.welcome(false))
  }
}

// ── Courier response handler ──────────────────────────────────────────────────
async function handleCourierResponse(phone: string, response: '1' | '0'): Promise<boolean> {
  // Find if this phone belongs to a courier
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('phone', phone)
    .single()

  if (!user || user.role !== 'courier') return false

  const { data: courier } = await supabaseAdmin
    .from('couriers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!courier) return false

  // Find the latest pending dispatch for this courier
  const { data: log } = await supabaseAdmin
    .from('dispatch_log')
    .select('order_id, attempt')
    .eq('courier_id', courier.id)
    .eq('result', 'timeout')  // still open
    .order('offered_at', { ascending: false })
    .limit(1)
    .single()

  if (!log) return false

  const result = response === '1' ? 'accepted' : 'rejected'

  await supabaseAdmin
    .from('dispatch_log')
    .update({ result, responded_at: new Date().toISOString() })
    .eq('order_id', log.order_id)
    .eq('courier_id', courier.id)
    .eq('attempt', log.attempt)

  if (response === '0') {
    await sendWhatsApp(phone, `✅ Order ditolak. Terima kasih!`)
  }
  // Acceptance confirmation is sent by the dispatch engine when it detects acceptance

  return true
}

// ── Status check helper ───────────────────────────────────────────────────────
async function handleStatusCheck(phone: string, userId?: string): Promise<void> {
  if (!userId) {
    await sendWhatsApp(phone, `Anda belum terdaftar. Kirim pesan apa saja untuk memulai.`)
    return
  }
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('order_code, status, created_at')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false })
    .limit(3)

  if (!orders?.length) {
    await sendWhatsApp(phone, `Anda belum memiliki order. Ketik *ORDER* untuk mulai.`)
    return
  }

  const lines = orders.map(o =>
    `📦 *${o.order_code}* — ${o.status.toUpperCase()}\n🔗 ${APP_URL}/tracking/${o.order_code}`
  )
  await sendWhatsApp(phone, `📋 *Order terakhir Anda:*\n\n${lines.join('\n\n')}`)
}
