'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Package, MapPin, User, Phone, FileText, Navigation,
  Loader2, CheckCircle, ArrowRight, Clock, Truck,
  ChevronDown, AlertCircle, ShieldCheck,
} from 'lucide-react'
import { formatIDR } from '@/lib/pricing'

// ── Zone reference data ────────────────────────────────────────────────────
const ZONES = [
  'Gerung Kota', 'Giri Menang', 'Dasan Baru',
  'Banyu Urip', 'Beleke', 'Tempos', 'Mataram',
]

const KM_LOOKUP: Record<string, number> = {
  'Gerung Kota|Giri Menang': 2.4, 'Gerung Kota|Dasan Baru': 3.2, 'Gerung Kota|Banyu Urip': 4.8,
  'Gerung Kota|Beleke': 4.2, 'Gerung Kota|Tempos': 1.8, 'Gerung Kota|Mataram': 8.6,
  'Giri Menang|Dasan Baru': 2.8, 'Giri Menang|Banyu Urip': 3.6, 'Giri Menang|Beleke': 5.6,
  'Giri Menang|Tempos': 1.5, 'Giri Menang|Mataram': 7.4,
  'Dasan Baru|Banyu Urip': 1.9, 'Dasan Baru|Beleke': 5.2, 'Dasan Baru|Tempos': 3.0,
  'Dasan Baru|Mataram': 6.9, 'Banyu Urip|Beleke': 6.0, 'Banyu Urip|Tempos': 4.6,
  'Banyu Urip|Mataram': 5.2, 'Beleke|Tempos': 5.4, 'Beleke|Mataram': 9.4, 'Tempos|Mataram': 7.0,
}

const PACKAGE_TYPES = [
  { value: '',           label: 'Pilih jenis paket',   weight: 0 },
  { value: 'Dokumen',   label: '📄 Dokumen / Surat',   weight: 0.2 },
  { value: 'Makanan',   label: '🍱 Makanan & Minuman', weight: 0.5 },
  { value: 'Paket Kecil',  label: '📦 Paket Kecil (< 1 kg)',  weight: 0.8 },
  { value: 'Paket Sedang', label: '📦 Paket Sedang (1–3 kg)', weight: 2.0 },
  { value: 'Paket Besar',  label: '📦 Paket Besar (3–5 kg)',  weight: 4.0 },
  { value: 'Lainnya',   label: '📋 Barang Lainnya',    weight: 1.0 },
]

function lookupKm(a: string, b: string): number | null {
  const A = a.trim(), B = b.trim()
  if (!A || !B) return null
  if (A.toLowerCase() === B.toLowerCase()) return 0.5
  return KM_LOOKUP[`${A}|${B}`] ?? KM_LOOKUP[`${B}|${A}`] ?? null
}

function calcPrice(km: number): number {
  const base = km <= 2 ? 5000 : 5000 + Math.round((km - 2) * 2000)
  return Math.ceil(base / 500) * 500
}

function calcEta(km: number): number {
  return Math.max(6, Math.round(6 + km * 2.4))
}

// ── Types ───────────────────────────────────────────────────────────────────
type FieldErrors = Record<string, string>

// ── Component ───────────────────────────────────────────────────────────────
export default function OrderPage() {
  const [step,  setStep]  = useState<'form' | 'submitting' | 'success'>('form')
  const [errors, setErrors] = useState<FieldErrors>({})

  // Form
  const [senderName,      setSenderName]      = useState('')
  const [senderPhone,     setSenderPhone]     = useState('')
  const [pickupZone,      setPickupZone]      = useState('')
  const [pickupAddress,   setPickupAddress]   = useState('')
  const [recipientName,   setRecipientName]   = useState('')
  const [recipientPhone,  setRecipientPhone]  = useState('')
  const [destZone,        setDestZone]        = useState('')
  const [destAddress,     setDestAddress]     = useState('')
  const [packageType,     setPackageType]     = useState('')
  const [notes,           setNotes]           = useState('')

  // Preview
  const [geoLoading, setGeoLoading] = useState(false)
  const [preview,    setPreview]    = useState<{
    distance_km: number; price: number; eta: number
    pickup_lat?: number; pickup_lng?: number
    dropoff_lat?: number; dropoff_lng?: number
    pickup_display?: string; dropoff_display?: string
  } | null>(null)

  // Success
  const [result, setResult] = useState<{
    order_code: string; courier_name?: string; courier_phone?: string
    pickup?: string; dest?: string; fee?: number; km?: number
  } | null>(null)

  // ── Auto-calculate pricing ──────────────────────────────────────────────────
  const effectivePickup = pickupZone || pickupAddress || 'Gerung Kota'
  const effectiveDest   = destZone   || destAddress   || 'Dasan Baru'

  useEffect(() => {
    const km = lookupKm(effectivePickup, effectiveDest)
    if (km === null) { setPreview(null); return }
    setPreview({
      distance_km: km, price: calcPrice(km), eta: calcEta(km),
      pickup_display: effectivePickup, dropoff_display: effectiveDest,
    })
    geocodeAddresses()
  }, [effectivePickup, effectiveDest])

  const geocodeAddresses = useCallback(async () => {
    setGeoLoading(true)
    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup_address: effectivePickup,
          dropoff_address: effectiveDest,
          weight_kg: PACKAGE_TYPES.find(p => p.value === packageType)?.weight ?? 1.0,
        }),
      })
      if (!res.ok) return
      const data = await res.json()
      setPreview(prev => prev ? {
        ...prev,
        distance_km:     data.route?.distance_km ?? prev.distance_km,
        price:           data.pricing?.delivery_fee ?? prev.price,
        pickup_lat:      data.pickup?.lat,
        pickup_lng:      data.pickup?.lng,
        dropoff_lat:     data.dropoff?.lat,
        dropoff_lng:     data.dropoff?.lng,
        pickup_display:  data.pickup?.display_name ?? prev.pickup_display,
        dropoff_display: data.dropoff?.display_name ?? prev.dropoff_display,
      } : null)
    } finally { setGeoLoading(false) }
  }, [effectivePickup, effectiveDest, packageType])

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: FieldErrors = {}
    if (!senderName.trim() || senderName.trim().length < 2) e.senderName = 'Nama pengirim wajib diisi'
    if (!senderPhone.trim() || !/^(08|\+?62)\d{8,12}$/.test(senderPhone.replace(/[\s\-\(\)]/g, '')))
      e.senderPhone = 'Nomor WhatsApp tidak valid (08xx)'
    if (!recipientName.trim() || recipientName.trim().length < 2) e.recipientName = 'Nama penerima wajib diisi'
    if (recipientPhone.trim() && !/^(08|\+?62)\d{8,12}$/.test(recipientPhone.replace(/[\s\-\(\)]/g, '')))
      e.recipientPhone = 'Format nomor tidak valid'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const pkg = PACKAGE_TYPES.find(p => p.value === packageType)
    setStep('submitting')

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name:   senderName.trim(),
          customer_phone:  senderPhone.trim(),
          pickup_address:  pickupAddress.trim() || effectivePickup,
          dropoff_address: destAddress.trim()    || effectiveDest,
          pickup_lat:      preview?.pickup_lat   ?? 0,
          pickup_lng:      preview?.pickup_lng   ?? 0,
          dropoff_lat:     preview?.dropoff_lat  ?? 0,
          dropoff_lng:     preview?.dropoff_lng  ?? 0,
          item_type:       packageType || 'Paket',
          item_weight_kg:  pkg?.weight ?? 1.0,
          notes:           [notes.trim(), recipientName ? `Penerima: ${recipientName}` : null,
                            recipientPhone ? `/ ${recipientPhone}` : null]
                            .filter(Boolean).join(' '),
          distance_km:     preview?.distance_km ?? 1,
          payment_method:  'cod',
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErrors({ submit: data.error ?? 'Gagal membuat order' }); setStep('form'); return }

      setResult({
        order_code:    data.data.order_code,
        courier_name:  data.courier_name,
        courier_phone: data.courier_phone,
        pickup:        pickupAddress.trim() || effectivePickup,
        dest:          destAddress.trim()    || effectiveDest,
        fee:           preview?.price,
        km:            preview?.distance_km,
      })
      setStep('success')
    } catch {
      setErrors({ submit: 'Gagal menghubungi server. Coba lagi.' })
      setStep('form')
    }
  }

  // ── Shared input class ──────────────────────────────────────────────────────
  const inputCls = (field: string) =>
    `w-full px-4 py-3.5 rounded-xl border text-sm transition-colors outline-none ${
      errors[field]
        ? 'border-red-300 bg-red-50 focus:border-red-400'
        : 'border-gray-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100'
    }`

  // ═══════════════════════════════════════════════════════════════════════════
  // SUCCESS SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'success' && result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-900 via-brand-800 to-brand-900 flex flex-col items-center justify-center px-5 py-12 text-white">
        <div className="w-full max-w-sm space-y-6">

          {/* Success icon */}
          <div className="text-center">
            <div className="w-20 h-20 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-400/30">
              <CheckCircle size={40} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold">Order Berhasil!</h1>
            <p className="text-white/60 text-sm mt-1">Kurir akan segera dijadwalkan 🛵</p>
          </div>

          {/* Order details card */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="w-10 h-10 bg-brand-500/30 rounded-xl flex items-center justify-center">
                <Package size={20} className="text-brand-200" />
              </div>
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wide">Nomor Order</p>
                <p className="font-mono font-bold text-xl tracking-wide">{result.order_code}</p>
              </div>
            </div>

            {result.pickup && result.dest && (
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-2 shrink-0" />
                  <div>
                    <p className="text-xs text-white/40">Jemput</p>
                    <p className="text-sm font-medium">{result.pickup}</p>
                  </div>
                </div>
                <div className="w-px h-4 bg-white/20 ml-1" />
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-400 mt-2 shrink-0" />
                  <div>
                    <p className="text-xs text-white/40">Tujuan</p>
                    <p className="text-sm font-medium">{result.dest}</p>
                  </div>
                </div>
              </div>
            )}

            {(result.km || result.fee) && (
              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-sm">
                <span className="text-white/50">
                  {result.km ? `${result.km} km` : ''}
                </span>
                <span className="font-bold text-green-300 text-lg">
                  {result.fee ? formatIDR(result.fee) : ''}
                </span>
              </div>
            )}

            {result.courier_name && (
              <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Truck size={20} className="text-green-300" />
                </div>
                <div>
                  <p className="text-xs text-white/40">Kurir Ditugaskan</p>
                  <p className="font-semibold">{result.courier_name}</p>
                  {result.courier_phone && (
                    <a href={`https://wa.me/${result.courier_phone.replace(/\D/g, '')}`}
                       className="text-xs text-green-300 hover:underline" target="_blank" rel="noopener noreferrer">
                      {result.courier_phone.replace(/^62/, '0')}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CTA buttons */}
          <a href={`/tracking/${result.order_code}`}
             className="w-full py-4 bg-brand-500 hover:bg-brand-400 text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand-500/25">
            <Clock size={22} /> Lacak Pesanan
          </a>
          <a href="/order"
             className="block text-center text-sm text-white/50 hover:text-white/70 py-2">
            Buat Order Baru
          </a>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FORM SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Header */}
      <div className="bg-brand-900 text-white px-5 pt-8 pb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🛵</span>
            <div>
              <h1 className="text-xl font-bold">GiriGo Courier</h1>
              <p className="text-white/50 text-xs">Gerung, Lombok Barat</p>
            </div>
          </div>
          <p className="text-white/70 text-sm mt-3">Isi form di bawah, kurir kami siap antar 🚀</p>
        </div>
      </div>

      {/* Price estimator */}
      <div className="px-4 -mt-3 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-4 flex items-center gap-3">
          <div className={`p-2.5 rounded-xl shrink-0 ${preview ? 'bg-green-50' : 'bg-gray-100'}`}>
            <Navigation size={18} className={preview ? 'text-green-500' : 'text-gray-400'} />
          </div>
          <div className="flex-1 min-w-0">
            {preview ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold text-gray-700">{preview.distance_km} km</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-500">~{preview.eta} min</span>
                </div>
                <span className="font-bold text-green-600 text-lg">{formatIDR(preview.price)}</span>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Pilih zona untuk estimasi ongkir</p>
            )}
          </div>
          {geoLoading && <Loader2 size={16} className="animate-spin text-gray-400 shrink-0" />}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4 pb-28" noValidate>
        {errors.submit && (
          <div className="flex items-center gap-3 px-4 py-3.5 bg-red-50 border border-red-200 rounded-2xl">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700 font-medium">{errors.submit}</p>
          </div>
        )}

        {/* ── Section: Pengirim ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <User size={15} className="text-brand-500" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Data Pengirim</span>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nama Lengkap *</label>
              <input className={inputCls('senderName')} placeholder="Budi Santoso"
                     value={senderName} onChange={e => { setSenderName(e.target.value); setErrors(p => ({...p, senderName:''})) }} />
              {errors.senderName && <p className="text-xs text-red-500 mt-1">{errors.senderName}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">WhatsApp *</label>
              <input className={inputCls('senderPhone')} placeholder="081234567890" type="tel"
                     value={senderPhone} onChange={e => { setSenderPhone(e.target.value); setErrors(p => ({...p, senderPhone:''})) }} />
              {errors.senderPhone && <p className="text-xs text-red-500 mt-1">{errors.senderPhone}</p>}
            </div>
          </div>
        </div>

        {/* ── Section: Alamat Penjemputan ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <MapPin size={15} className="text-green-500" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Alamat Penjemputan</span>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Zona (opsional)</label>
              <div className="relative">
                <select className={`${inputCls('')} appearance-none pr-10`}
                        value={pickupZone} onChange={e => setPickupZone(e.target.value)}>
                  <option value="">Pilih zona...</option>
                  {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Atau ketik alamat lengkap</label>
              <input className={inputCls('')} placeholder="Jl. Gajah Mada No.5, Gerung"
                     value={pickupAddress} onChange={e => setPickupAddress(e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Section: Penerima ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <User size={15} className="text-purple-500" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Data Penerima</span>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nama Penerima *</label>
              <input className={inputCls('recipientName')} placeholder="Ani Rahayu"
                     value={recipientName} onChange={e => { setRecipientName(e.target.value); setErrors(p => ({...p, recipientName:''})) }} />
              {errors.recipientName && <p className="text-xs text-red-500 mt-1">{errors.recipientName}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">WhatsApp Penerima (opsional)</label>
              <input className={inputCls('recipientPhone')} placeholder="087654321098" type="tel"
                     value={recipientPhone} onChange={e => { setRecipientPhone(e.target.value); setErrors(p => ({...p, recipientPhone:''})) }} />
              {errors.recipientPhone && <p className="text-xs text-red-500 mt-1">{errors.recipientPhone}</p>}
            </div>
          </div>
        </div>

        {/* ── Section: Alamat Tujuan ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <MapPin size={15} className="text-red-500" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Alamat Tujuan</span>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Zona (opsional)</label>
              <div className="relative">
                <select className={`${inputCls('')} appearance-none pr-10`}
                        value={destZone} onChange={e => setDestZone(e.target.value)}>
                  <option value="">Pilih zona...</option>
                  {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Atau ketik alamat lengkap</label>
              <input className={inputCls('')} placeholder="Jl. Sudirman No.10, Kediri"
                     value={destAddress} onChange={e => setDestAddress(e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Section: Detail Paket ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <Package size={15} className="text-amber-500" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Detail Paket</span>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Jenis Paket</label>
              <div className="relative">
                <select className={`${inputCls('')} appearance-none pr-10`}
                        value={packageType} onChange={e => setPackageType(e.target.value)}>
                  {PACKAGE_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Catatan Tambahan</label>
              <div className="relative">
                <FileText size={16} className="absolute left-3 top-3.5 text-gray-400" />
                <textarea className={`${inputCls('')} pl-10 resize-none`} rows={2}
                          placeholder="Catatan untuk kurir (opsional)..."
                          value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Spacer for sticky button */}
        <div className="h-4" />
      </form>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur border-t border-gray-100 z-50">
        <button onClick={handleSubmit}
                disabled={step === 'submitting'}
                className="w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 disabled:bg-brand-300 text-white font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-brand-500/25 active:scale-[0.98]">
          {step === 'submitting' ? (
            <><Loader2 size={22} className="animate-spin" /> Membuat Order...</>
          ) : (
            <><Truck size={22} /> Pesan Kurir Sekarang</>
          )}
        </button>
        {preview && (
          <p className="text-xs text-gray-400 text-center mt-2 flex items-center justify-center gap-1.5">
            <ShieldCheck size={12} className="text-green-500" />
            <span>Estimasi ongkir <strong className="text-gray-600">{formatIDR(preview.price)}</strong></span>
            <span className="text-gray-300">·</span>
            <span>{preview.distance_km} km</span>
            <span className="text-gray-300">·</span>
            <span>±{preview.eta} mnt</span>
          </p>
        )}
      </div>
    </div>
  )
}
