// =============================================================================
// GiriGo — WhatsApp Bot State Machine v2
// Menu-based flow: menu → name → pickup → dropoff → recipient → auto-order
// Backward-compatible: ORDER, STATUS, BANTUAN, BATAL still work from idle
// =============================================================================

import { supabaseAdmin }   from '@/lib/supabase'
import { sendWhatsApp }    from '@/lib/whatsapp'
import { geocodeAddress, getRouteDistance } from '@/lib/maps'
import { calculatePrice, normalizePhone, formatIDR, isValidPhone } from '@/lib/pricing'
import { dispatchOrder }   from '@/lib/dispatch'
import type { WaSession, OrderContext, WhatsAppInboundMessage, SessionState } from '@/types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://girigocourier.vercel.app'
const ADMIN_PHONE = process.env.ADMIN_WHATSAPP_NUMBER ?? ''

// ── Session helpers ───────────────────────────────────────────────────────────
async function getSession(phone: string): Promise<WaSession> {
  const { data } = await supabaseAdmin
    .from('wa_sessions')
    .select('*')
    .eq('phone', phone)
    .single()

  if (data) return data as WaSession

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

  await supabaseAdmin
    .from('wa_sessions')
    .update({ user_id: newUser.id })
    .eq('phone', phone)

  return newUser
}

// ── Messages ──────────────────────────────────────────────────────────────────
const MSG = {
  menu: (name?: string) => [
    `🛵 *GiriGo Courier — Gerung, Lombok Barat*`,
    ``,
    name ? `Halo *${name}*! 👋` : `Halo! 👋`,
    ``,
    `Silakan pilih layanan:`,
    ``,
    `*1* — 📦 Buat Pengiriman Baru`,
    `*2* — 🔎 Lacak Paket`,
    `*3* — 📞 Hubungi Admin`,
    ``,
    `_Balas dengan nomor 1, 2, atau 3_`,
  ].join('\n'),

  askName: [
    `📝 *Data Pengirim*`,
    ``,
    `Siapa nama Anda?`,
    `_Contoh: Budi Santoso_`,
  ].join('\n'),

  askPickup: [
    `📍 *Alamat Penjemputan*`,
    ``,
    `Kirimkan alamat lengkap untuk penjemputan paket.`,
    `_Contoh: Jl. Gajah Mada No.5, Gerung_`,
  ].join('\n'),

  askRecipientName: [
    `👤 *Data Penerima*`,
    ``,
    `Siapa nama penerima paket?`,
    `_Contoh: Ani Rahayu_`,
  ].join('\n'),

  askRecipientPhone: (name: string) => [
    `📱 *Nomor Penerima*`,
    ``,
    `Masukkan nomor WhatsApp penerima (*${name}*):`,
    `_Contoh: 081234567890_`,
  ].join('\n'),

  askDropoff: [
    `🏠 *Alamat Tujuan*`,
    ``,
    `Kirimkan alamat lengkap tujuan pengiriman.`,
    `_Contoh: Jl. Sudirman No.10, Kediri_`,
  ].join('\n'),

  askItemType: [
    `📦 *Jenis Barang*`,
    ``,
    `Deskripsikan barang yang akan dikirim:`,
    `_Contoh: Dokumen penting, 2 bungkus nasi, Sepatu_`,
  ].join('\n'),

  geocodingWait: `⏳ _Sedang menghitung jarak... mohon tunggu_`,

  geocodingFailed: (addr: string) => [
    `⚠️ Maaf, alamat tidak ditemukan: "${addr}"`,
    ``,
    `Coba kirim ulang dengan lebih spesifik.`,
    `_Contoh: Jl. Raya Gerung No.12, Gerung, Lombok Barat_`,
  ].join('\n'),

  orderCreated: (orderCode: string, ctx: OrderContext) => [
    `🎉 *Order Berhasil Dibuat!*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📦 No. Order: *${orderCode}*`,
    `📍 Jemput: ${ctx.pickup_address}`,
    `🏠 Antar:   ${ctx.dropoff_address}`,
    `👤 Penerima: ${ctx.recipient_name ?? '—'}`,
    `📱 Telp: ${ctx.recipient_phone ?? '—'}`,
    `📦 Barang: ${ctx.item_type ?? 'Paket'}`,
    `📏 Jarak:   ${ctx.distance_km} km`,
    `💵 Ongkir: *${formatIDR(ctx.delivery_fee!)}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `Kurir akan segera dijadwalkan 🛵`,
    ``,
    `🔗 *Live Tracking:*`,
    `${APP_URL}/tracking/${orderCode}`,
    ``,
    `Ketik *MENU* untuk kembali ke menu utama`,
  ].join('\n'),

  adminNotify: (orderCode: string, ctx: OrderContext, customerName: string) => [
    `📢 *New Order: ${orderCode}*`,
    `👤 Customer: ${customerName}`,
    `📍 ${ctx.pickup_address} → ${ctx.dropoff_address}`,
    `📦 ${ctx.item_type ?? 'Paket'} · ${ctx.distance_km} km`,
    `👤 Recipient: ${ctx.recipient_name ?? '—'} · ${ctx.recipient_phone ?? '—'}`,
    `💵 ${formatIDR(ctx.delivery_fee!)}`,
    ``,
    `${APP_URL}/admin/orders`,
  ].join('\n'),

  askTracking: [
    `🔎 *Lacak Paket*`,
    ``,
    `Masukkan nomor order Anda:`,
    `_Format: GG-YYMMDD-NNN_`,
    `_Contoh: GG-250101-001_`,
  ].join('\n'),

  trackingResult: (code: string, status: string, courier?: string) => [
    `📦 *${code}*`,
    `Status: *${status.toUpperCase()}*`,
    courier ? `Kurir: ${courier}` : null,
    ``,
    `🔗 ${APP_URL}/tracking/${code}`,
  ].filter(Boolean).join('\n'),

  trackingNotFound: (code: string) => [
    `⚠️ Order *${code}* tidak ditemukan.`,
    `Periksa kembali nomor order Anda.`,
  ].join('\n'),

  adminContact: [
    `📞 *Hubungi Admin GiriGo*`,
    ``,
    `Admin kami siap membantu Anda:`,
    ADMIN_PHONE ? `wa.me/${ADMIN_PHONE.replace(/\D/g, '')}` : '',
    ``,
    `Ketik *MENU* untuk kembali ke menu utama`,
  ].filter(Boolean).join('\n'),

  cancelled: `❌ Dibatalkan. Ketik apa saja untuk kembali ke menu.`,

  help: [
    `ℹ️ *GiriGo Courier — Bantuan*`,
    ``,
    `Perintah yang tersedia:`,
    `• *MENU* — Kembali ke menu utama`,
    `• *BATAL* — Batalkan proses saat ini`,
    `• *STATUS* — Cek status order terakhir`,
    ``,
    ADMIN_PHONE ? `📞 Admin: wa.me/${ADMIN_PHONE.replace(/\D/g, '')}` : '',
  ].filter(Boolean).join('\n'),

  statusList: (orders: any[]) => {
    const lines = orders.map(o =>
      `📦 *${o.order_code}* — ${o.status.toUpperCase()}\n🔗 ${APP_URL}/tracking/${o.order_code}`
    )
    return `📋 *Order terakhir Anda:*\n\n${lines.join('\n\n')}`
  },

  noOrders: `Anda belum memiliki order. Ketik *1* untuk membuat pengiriman baru.`,
}

// ── PACKAGE TYPES (weight estimation) ────────────────────────────────────────
function estimateWeight(desc: string): { type: string; weight: number } {
  const d = desc.toLowerCase()
  if (d.includes('dokumen') || d.includes('surat') || d.includes('kertas'))  return { type: 'Dokumen', weight: 0.2 }
  if (d.includes('makan')  || d.includes('nasi')   || d.includes('minum'))    return { type: 'Makanan & Minuman', weight: 0.5 }
  if (d.includes('kecil')  || d.includes('ringan') || d.includes('aksesoris')) return { type: 'Paket Kecil', weight: 0.8 }
  if (d.includes('sedang') || d.includes('baju')   || d.includes('pakaian'))   return { type: 'Paket Sedang', weight: 2.0 }
  if (d.includes('besar')  || d.includes('berat')  || d.includes('elektronik')) return { type: 'Paket Besar', weight: 4.0 }
  return { type: desc.slice(0, 30) || 'Paket', weight: 1.0 }
}

// ── Main message handler ──────────────────────────────────────────────────────
export async function handleInboundMessage(msg: WhatsAppInboundMessage): Promise<void> {
  const phone   = normalizePhone(msg.from)
  const text    = msg.body.trim()
  const textUp  = text.toUpperCase()
  const session = await getSession(phone)
  const ctx     = session.context as OrderContext

  // ── Global commands ────────────────────────────────────────────────────────
  if (textUp === 'BANTUAN' || textUp === 'HELP') {
    await sendWhatsApp(phone, MSG.help)
    return
  }

  if (textUp === 'BATAL' || textUp === 'CANCEL') {
    await updateSession(phone, 'idle', {})
    await sendWhatsApp(phone, MSG.cancelled)
    return
  }

  if (textUp === 'MENU') {
    const user = await getOrCreateUser(phone)
    await updateSession(phone, 'menu')
    await sendWhatsApp(phone, MSG.menu(user?.name))
    return
  }

  if (textUp === 'STATUS') {
    await handleStatusCheck(phone)
    return
  }

  // Courier response handling (couriers reply "1" or "0" to job offers)
  if (text === '1' || text === '0') {
    const isCourier = await handleCourierResponse(phone, text)
    if (isCourier) return
  }

  // ── State machine ──────────────────────────────────────────────────────────
  switch (session.state) {

    // ── IDLE ────────────────────────────────────────────────────────────────
    case 'idle': {
      if (textUp === 'ORDER' || text === '1') {
        // Legacy ORDER command → skip to pickup if user exists
        const user = await getOrCreateUser(phone)
        if (!user) {
          await updateSession(phone, 'awaiting_name')
          await sendWhatsApp(phone, MSG.askName)
        } else {
          await updateSession(phone, 'awaiting_pickup')
          await sendWhatsApp(phone, MSG.askPickup)
        }
      } else {
        // New message from idle → show menu
        const user = await getOrCreateUser(phone)
        await updateSession(phone, 'menu')
        await sendWhatsApp(phone, MSG.menu(user?.name))
      }
      break
    }

    // ── MENU ────────────────────────────────────────────────────────────────
    case 'menu': {
      if (text === '1') {
        const user = await getOrCreateUser(phone)
        if (!user) {
          await updateSession(phone, 'awaiting_name')
          await sendWhatsApp(phone, MSG.askName)
        } else {
          await updateSession(phone, 'awaiting_pickup')
          await sendWhatsApp(phone, MSG.askPickup)
        }
      } else if (text === '2') {
        await updateSession(phone, 'idle')
        await sendWhatsApp(phone, MSG.askTracking)
        // We check for tracking code inline
      } else if (text === '3') {
        await sendWhatsApp(phone, MSG.adminContact)
      } else if (textUp.match(/^GG-\d{6}-\d{3}$/)) {
        // Tracking code entered
        await handleTrackingLookup(phone, textUp)
      } else {
        await sendWhatsApp(phone, `Pilih *1*, *2*, atau *3* ya 😊\n\n${MSG.menu()}`)
      }
      break
    }

    // ── AWAITING NAME ───────────────────────────────────────────────────────
    case 'awaiting_name': {
      if (text.length < 2) {
        await sendWhatsApp(phone, `Nama terlalu pendek. Coba lagi 😊`)
        break
      }
      const user = await getOrCreateUser(phone, text)
      await updateSession(phone, 'awaiting_pickup')
      await sendWhatsApp(phone, [
        `Terima kasih, *${user?.name}*! 👋`,
        ``,
        MSG.askPickup,
      ].join('\n'))
      break
    }

    // ── AWAITING PICKUP ─────────────────────────────────────────────────────
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
          `✅ Jemput: _${geo.display_name}_`,
          ``,
          MSG.askDropoff,
        ].join('\n'))
      } catch {
        await sendWhatsApp(phone, MSG.geocodingFailed(text))
      }
      break
    }

    // ── AWAITING DROPOFF ────────────────────────────────────────────────────
    case 'awaiting_dropoff': {
      await sendWhatsApp(phone, MSG.geocodingWait)
      try {
        const geo   = await geocodeAddress(text)
        const route = await getRouteDistance(ctx.pickup_lat!, ctx.pickup_lng!, geo.lat, geo.lng)

        await updateSession(phone, 'awaiting_recipient_name', {
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
          MSG.askRecipientName,
        ].join('\n'))
      } catch {
        await sendWhatsApp(phone, MSG.geocodingFailed(text))
      }
      break
    }

    // ── AWAITING RECIPIENT NAME ─────────────────────────────────────────────
    case 'awaiting_recipient_name': {
      if (text.length < 2) {
        await sendWhatsApp(phone, `Nama penerima terlalu pendek. Coba lagi 😊`)
        break
      }
      await updateSession(phone, 'awaiting_recipient_phone', {
        ...ctx,
        recipient_name: text,
      })
      await sendWhatsApp(phone, MSG.askRecipientPhone(text))
      break
    }

    // ── AWAITING RECIPIENT PHONE ────────────────────────────────────────────
    case 'awaiting_recipient_phone': {
      const normalized = normalizePhone(text)
      if (!isValidPhone(normalized)) {
        await sendWhatsApp(phone, `Nomor tidak valid. Masukkan nomor WA Indonesia (08xx).`)
        break
      }
      await updateSession(phone, 'awaiting_package_type', {
        ...ctx,
        recipient_phone: normalized,
      })
      await sendWhatsApp(phone, MSG.askItemType)
      break
    }

    // ── AWAITING ITEM TYPE ─────────────────────────────────────────────────
    case 'awaiting_package_type': {
      if (text.length < 2) {
        await sendWhatsApp(phone, `Deskripsikan barang yang akan dikirim ya 😊\n\n${MSG.askItemType}`)
        break
      }
      const pkg  = estimateWeight(text)
      const pricing = calculatePrice(ctx.distance_km!, pkg.weight)

      // Auto-create order — no confirmation step needed
      const user = await getOrCreateUser(phone)
      if (!user) {
        await sendWhatsApp(phone, `⚠️ Gagal membuat akun. Coba lagi.`)
        await updateSession(phone, 'menu')
        break
      }

      const { data: order, error } = await supabaseAdmin
        .from('orders')
        .insert({
          customer_id:      user.id,
          pickup_address:   ctx.pickup_address!,
          pickup_lat:       ctx.pickup_lat!,
          pickup_lng:       ctx.pickup_lng!,
          dropoff_address:  ctx.dropoff_address!,
          dropoff_lat:      ctx.dropoff_lat!,
          dropoff_lng:      ctx.dropoff_lng!,
          item_type:        pkg.type,
          item_weight_kg:   pkg.weight,
          distance_km:      ctx.distance_km!,
          base_fee:         pricing.base_fee,
          weight_surcharge: pricing.weight_surcharge,
          delivery_fee:     pricing.delivery_fee,
          package_value:    0,
          payment_method:   'cod',
          notes:            ctx.recipient_name
            ? `Penerima: ${ctx.recipient_name} / ${ctx.recipient_phone}`
            : null,
          status:           'pending',
        })
        .select()
        .single()

      if (error || !order) {
        await sendWhatsApp(phone, `⚠️ Gagal membuat order. Coba lagi atau hubungi admin.`)
        await updateSession(phone, 'menu')
        break
      }

      const finalCtx = {
        ...ctx,
        item_type:      pkg.type,
        item_weight_kg: pkg.weight,
        delivery_fee:   pricing.delivery_fee,
        order_id:       order.id,
        order_code:     order.order_code,
      }

      await updateSession(phone, 'order_active', finalCtx)
      await sendWhatsApp(phone, MSG.orderCreated(order.order_code, finalCtx))

      // Notify admin
      const customerName = user.name ?? 'Unknown'
      if (ADMIN_PHONE) {
        await sendWhatsApp(ADMIN_PHONE, MSG.adminNotify(order.order_code, finalCtx, customerName))
      }

      // Trigger dispatch asynchronously
      dispatchOrder(order.id).catch(e => console.error('[Dispatch]', e))
      break
    }

    // ── AWAITING PAYMENT (legacy flow) ──────────────────────────────────────
    case 'awaiting_payment': {
      const method = PAYMENT_MAP[text.toLowerCase()]
      if (!method) {
        await sendWhatsApp(phone, `Pilih metode pembayaran:\n\n${LEGACY_MSG.askPayment}`)
        break
      }
      const newCtx = { ...ctx, payment_method: method, package_value: 0 }

      if (method === 'cod') {
        await updateSession(phone, 'awaiting_confirmation', newCtx)
        await sendWhatsApp(phone, LEGACY_MSG.askCODValue)
      } else {
        await updateSession(phone, 'awaiting_confirmation', newCtx)
        await sendWhatsApp(phone, LEGACY_MSG.quote(newCtx))
      }
      break
    }

    // ── AWAITING CONFIRMATION (legacy flow) ─────────────────────────────────
    case 'awaiting_confirmation': {
      if (ctx.payment_method === 'cod' && !ctx.package_value) {
        const amount = parseInt(text.replace(/\D/g, ''), 10)
        if (isNaN(amount) || amount < 0) {
          await sendWhatsApp(phone, `Masukkan nilai barang dalam angka. Contoh: 150000`)
          break
        }
        const newCtx = { ...ctx, package_value: amount }
        await updateSession(phone, 'awaiting_confirmation', newCtx)
        await sendWhatsApp(phone, LEGACY_MSG.quote(newCtx))
        break
      }

      if (textUp === 'YA' || text === '1') {
        await createLegacyOrder(phone, ctx)
      } else if (textUp === 'BATAL' || text === '0') {
        await updateSession(phone, 'idle', {})
        await sendWhatsApp(phone, MSG.cancelled)
      } else {
        await sendWhatsApp(phone, `Balas *YA* untuk konfirmasi atau *BATAL* untuk membatalkan.`)
      }
      break
    }

    // ── ORDER ACTIVE ────────────────────────────────────────────────────────
    case 'order_active': {
      if (textUp === 'STATUS') {
        await handleStatusCheck(phone)
        break
      }

      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('status, order_code, courier:couriers(user:users(name))')
        .eq('id', ctx.order_id!)
        .single()

      if (order?.status === 'delivered') {
        const courierName = (order.courier as any)?.user?.name ?? 'Kurir'
        await updateSession(phone, 'awaiting_rating')
        await sendWhatsApp(phone, LEGACY_MSG.askRating(courierName))
      } else {
        await sendWhatsApp(phone, [
          `📦 Order *${ctx.order_code}* sedang dalam proses.`,
          `Status: ${order?.status?.toUpperCase() ?? '?'}`,
          `🔗 ${APP_URL}/tracking/${ctx.order_code}`,
        ].join('\n'))
      }
      break
    }

    // ── AWAITING RATING ─────────────────────────────────────────────────────
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
      await sendWhatsApp(phone, LEGACY_MSG.ratingThanks(score))
      break
    }

    default:
      await updateSession(phone, 'idle', {})
      await sendWhatsApp(phone, MSG.menu())
  }
}

// ── Legacy message templates (for backward compat) ────────────────────────────
const LEGACY_MSG = {
  askPayment: [
    `💳 *Metode Pembayaran*`,
    ``,
    `1 — COD (Bayar di tempat)`,
    `2 — Transfer Bank`,
  ].join('\n'),

  askCODValue: [
    `💰 *Nilai Barang (COD)*`,
    ``,
    `Berapa nilai barang yang akan ditagihkan?`,
    `_Kirim dalam angka, contoh: 150000_`,
  ].join('\n'),

  quote: (ctx: OrderContext) => {
    const pricing = calculatePrice(ctx.distance_km!, ctx.item_weight_kg ?? 1)
    return [
      `✅ *Konfirmasi Order*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📍 ${ctx.pickup_address}`,
      `🏠 ${ctx.dropoff_address}`,
      `📦 ${ctx.item_type}`,
      `📏 ${ctx.distance_km} km`,
      `💵 *${formatIDR(pricing.delivery_fee)}*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `Balas *YA* untuk konfirmasi`,
      `Balas *BATAL* untuk membatalkan`,
    ].join('\n')
  },

  askRating: (courierName: string) => [
    `⭐ *Rating Pengiriman*`,
    ``,
    `Bagaimana pengalaman Anda dengan kurir *${courierName}*?`,
    `1 = ⭐ 2 = ⭐⭐ 3 = ⭐⭐⭐ 4 = ⭐⭐⭐⭐ 5 = ⭐⭐⭐⭐⭐`,
    `_Balas dengan angka 1–5_`,
  ].join('\n'),

  ratingThanks: (score: number) =>
    `Terima kasih atas rating ${'⭐'.repeat(score)} Anda! 🙏\n\nKetik apa saja untuk kembali ke menu.`,
}

// ── Legacy payment map ───────────────────────────────────────────────────────
const PAYMENT_MAP: Record<string, 'cod' | 'transfer' | 'ewallet'> = {
  '1': 'cod', '2': 'transfer', '3': 'ewallet',
  'cod': 'cod', 'transfer': 'transfer', 'ewallet': 'ewallet',
}

// ── Legacy order creation (for backward compat) ───────────────────────────────
async function createLegacyOrder(phone: string, ctx: OrderContext) {
  const user = await getOrCreateUser(phone)
  if (!user) return

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
    return
  }

  await updateSession(phone, 'order_active', { ...ctx, order_id: order.id, order_code: order.order_code })

  const finalCtx = { ...ctx, order_code: order.order_code, delivery_fee: pricing.delivery_fee }
  await sendWhatsApp(phone, MSG.orderCreated(order.order_code, finalCtx))

  const customerName = user.name ?? 'Unknown'
  if (ADMIN_PHONE) {
    await sendWhatsApp(ADMIN_PHONE, MSG.adminNotify(order.order_code, finalCtx, customerName))
  }

  dispatchOrder(order.id).catch(e => console.error('[Dispatch]', e))
}

// ── Courier response handler ──────────────────────────────────────────────────
async function handleCourierResponse(phone: string, response: '1' | '0'): Promise<boolean> {
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

  const { data: log } = await supabaseAdmin
    .from('dispatch_log')
    .select('order_id, attempt')
    .eq('courier_id', courier.id)
    .eq('result', 'timeout')
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

  return true
}

// ── Status check helper ───────────────────────────────────────────────────────
async function handleStatusCheck(phone: string): Promise<void> {
  const user = await getOrCreateUser(phone)
  if (!user) {
    await sendWhatsApp(phone, `Anda belum terdaftar. Kirim pesan apa saja untuk memulai.`)
    return
  }
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('order_code, status, created_at')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  if (!orders?.length) {
    await sendWhatsApp(phone, MSG.noOrders)
    return
  }

  await sendWhatsApp(phone, MSG.statusList(orders))
}

// ── Tracking lookup helper ────────────────────────────────────────────────────
async function handleTrackingLookup(phone: string, code: string): Promise<void> {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('order_code, status, courier:couriers(user:users(name))')
    .eq('order_code', code.toUpperCase())
    .single()

  if (!order) {
    await sendWhatsApp(phone, MSG.trackingNotFound(code))
    return
  }

  const courierName = (order.courier as any)?.user?.name
  await sendWhatsApp(phone, MSG.trackingResult(order.order_code, order.status, courierName))
}
