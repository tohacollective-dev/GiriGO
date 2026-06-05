'use client'
import { useState, useCallback, useEffect } from 'react'
import {
  Package, MapPin, User, Phone, FileText,
  Navigation, Loader2, CheckCircle, ArrowRight, Clock,
} from 'lucide-react'
import { formatIDR } from '@/lib/pricing'

// ── Zone constants (Gerung area) ────────────────────────────────────────────
const ZONES = [
  'Gerung Kota', 'Giri Menang', 'Dasan Baru',
  'Banyu Urip', 'Beleke', 'Tempos', 'Mataram',
]

// ── Client-side distance matrix (matches server Haversine until Google API called) ──
const KM_LOOKUP: Record<string, number> = {
  'Gerung Kota|Giri Menang': 2.4, 'Gerung Kota|Dasan Baru': 3.2, 'Gerung Kota|Banyu Urip': 4.8,
  'Gerung Kota|Beleke': 4.2, 'Gerung Kota|Tempos': 1.8, 'Gerung Kota|Mataram': 8.6,
  'Giri Menang|Dasan Baru': 2.8, 'Giri Menang|Banyu Urip': 3.6, 'Giri Menang|Beleke': 5.6,
  'Giri Menang|Tempos': 1.5, 'Giri Menang|Mataram': 7.4,
  'Dasan Baru|Banyu Urip': 1.9, 'Dasan Baru|Beleke': 5.2, 'Dasan Baru|Tempos': 3.0,
  'Dasan Baru|Mataram': 6.9, 'Banyu Urip|Beleke': 6.0, 'Banyu Urip|Tempos': 4.6,
  'Banyu Urip|Mataram': 5.2, 'Beleke|Tempos': 5.4, 'Beleke|Mataram': 9.4, 'Tempos|Mataram': 7.0,
}

function lookupKm(a: string, b: string): number | null {
  const A = a.trim(), B = b.trim()
  if (!A || !B) return null
  if (A.toLowerCase() === B.toLowerCase()) return 0.5
  return KM_LOOKUP[`${A}|${B}`] ?? KM_LOOKUP[`${B}|${A}`] ?? null
}

// ── Price calculator (matches server engine) ────────────────────────────────
function calcPrice(km: number): number {
  const base = km <= 2 ? 5000 : 5000 + Math.round((km - 2) * 2000)
  return Math.ceil(base / 500) * 500
}

// ── ETA estimator ───────────────────────────────────────────────────────────
function calcEta(km: number): number {
  return Math.max(6, Math.round(6 + km * 2.4))
}

// ── Main component ──────────────────────────────────────────────────────────
export default function OrderPage() {
  const [step, setStep] = useState<'form' | 'submitting' | 'success'>('form')

  // Form state
  const [senderName,        setSenderName]        = useState('')
  const [senderPhone,       setSenderPhone]       = useState('')
  const [pickupAddress,     setPickupAddress]     = useState('Gerung Kota')
  const [recipientName,     setRecipientName]     = useState('')
  const [recipientPhone,    setRecipientPhone]    = useState('')
  const [destAddress,       setDestAddress]       = useState('Dasan Baru')
  const [itemDescription,   setItemDescription]   = useState('')
  const [notes,             setNotes]             = useState('')
  const [error,             setError]             = useState<string | null>(null)

  // Geo / pricing state
  const [geoLoading, setGeoLoading] = useState(false)
  const [preview,    setPreview]    = useState<{
    distance_km: number; price: number; eta: number
    pickup_lat?: number; pickup_lng?: number
    dropoff_lat?: number; dropoff_lng?: number
    pickup_display?: string; dropoff_display?: string
  } | null>(null)

  // Success state
  const [result, setResult] = useState<{
    order_code: string
    courier_name?: string
    courier_phone?: string
  } | null>(null)

  // ── Auto-calculate on address change ───────────────────────────────────────
  useEffect(() => {
    const km = lookupKm(pickupAddress, destAddress)
    if (km === null) { setPreview(null); return }
    setPreview({
      distance_km:  km,
      price:        calcPrice(km),
      eta:          calcEta(km),
      pickup_display: pickupAddress,
      dropoff_display: destAddress,
    })
    // Try geocoding in background
    geocodeAddresses()
  }, [pickupAddress, destAddress])

  const geocodeAddresses = useCallback(async () => {
    setGeoLoading(true)
    try {
      const res = await fetch('/api/geocode', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          pickup_address:  pickupAddress,
          dropoff_address: destAddress,
          weight_kg:       1.0,
        }),
      })
      if (!res.ok) return
      const data = await res.json()
      setPreview(prev => prev ? {
        ...prev,
        distance_km:      data.route?.distance_km ?? prev.distance_km,
        price:            data.pricing?.delivery_fee ?? prev.price,
        pickup_lat:       data.pickup?.lat,
        pickup_lng:       data.pickup?.lng,
        dropoff_lat:      data.dropoff?.lat,
        dropoff_lng:      data.dropoff?.lng,
        pickup_display:   data.pickup?.display_name ?? prev.pickup_display,
        dropoff_display:  data.dropoff?.display_name ?? prev.dropoff_display,
      } : null)
    } finally {
      setGeoLoading(false)
    }
  }, [pickupAddress, destAddress])

  // ── Submit handler ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!senderName.trim() || !senderPhone.trim() || !recipientName.trim()) {
      setError('Mohon lengkapi semua field yang diperlukan')
      return
    }
    if (!/^(08|\+?62)\d{8,12}$/.test(senderPhone.replace(/[\s\-\(\)]/g, ''))) {
      setError('Nomor WhatsApp tidak valid')
      return
    }
    if (recipientPhone && !/^(08|\+?62)\d{8,12}$/.test(recipientPhone.replace(/[\s\-\(\)]/g, ''))) {
      setError('Nomor penerima tidak valid')
      return
    }

    setStep('submitting')

    try {
      const res = await fetch('/api/orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          customer_name:    senderName.trim(),
          customer_phone:   senderPhone.trim(),
          pickup_address:   pickupAddress,
          dropoff_address:  destAddress,
          pickup_lat:       preview?.pickup_lat ?? 0,
          pickup_lng:       preview?.pickup_lng ?? 0,
          dropoff_lat:      preview?.dropoff_lat ?? 0,
          dropoff_lng:      preview?.dropoff_lng ?? 0,
          item_type:        itemDescription.trim() || 'Paket',
          item_weight_kg:   1.0,
          notes:            notes.trim() || `Penerima: ${recipientName} / ${recipientPhone}`,
          distance_km:      preview?.distance_km ?? 1,
          payment_method:   'cod',
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Gagal membuat order')
        setStep('form')
        return
      }

      setResult({
        order_code:    data.data.order_code,
        courier_name:  data.courier_name,
        courier_phone: data.courier_phone,
      })
      setStep('success')

    } catch {
      setError('Gagal menghubungi server. Coba lagi.')
      setStep('form')
    }
  }

  // ── RENDER: Success ───────────────────────────────────────────────────────
  if (step === 'success' && result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-900 to-brand-800 flex flex-col items-center justify-center px-6 text-white text-center">
        <div className="w-20 h-20 bg-green-400 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={40} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Order Berhasil Dibuat!</h1>
        <p className="text-white/70 mb-8">Kurir akan segera dijadwalkan</p>

        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 w-full max-w-sm space-y-4 text-left">
          <div className="flex items-center gap-3">
            <Package size={20} className="text-brand-300" />
            <div>
              <p className="text-xs text-white/50">Nomor Order</p>
              <p className="font-mono font-bold text-lg">{result.order_code}</p>
            </div>
          </div>

          {result.courier_name && (
            <div className="flex items-center gap-3 pt-3 border-t border-white/10">
              <User size={20} className="text-green-300" />
              <div>
                <p className="text-xs text-white/50">Kurir</p>
                <p className="font-semibold">{result.courier_name}</p>
                {result.courier_phone && (
                  <a
                    href={`https://wa.me/${result.courier_phone.replace(/\D/g,'')}`}
                    className="text-sm text-green-300 hover:underline"
                    target="_blank" rel="noopener noreferrer"
                  >
                    {result.courier_phone}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <a
          href={`/tracking/${result.order_code}`}
          className="mt-6 w-full max-w-sm btn-primary py-4 flex items-center justify-center gap-2 text-lg"
        >
          <Clock size={20} />
          Lacak Pesanan
        </a>

        <a
          href="/order"
          className="mt-3 text-sm text-white/60 hover:text-white/80"
        >
          Buat Order Baru
        </a>
      </div>
    )
  }

  // ── RENDER: Form ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-brand-900 text-white px-5 pt-8 pb-8">
        <h1 className="text-xl font-bold flex items-center gap-2">
          🛵 GiriGo Courier
        </h1>
        <p className="text-white/60 text-sm mt-1">Pesan pengiriman dalam 1 menit</p>

        {/* Quick: pickup / dropoff + price preview */}
        <div className="mt-6 bg-white/10 backdrop-blur rounded-2xl p-4">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-white/50 text-xs mb-1">
                <MapPin size={12} className="text-green-400" />
                Jemput
              </div>
              <select
                value={pickupAddress}
                onChange={e => setPickupAddress(e.target.value)}
                className="w-full bg-transparent text-white font-semibold text-sm focus:outline-none"
              >
                {ZONES.map(z => <option key={z} value={z} className="text-gray-900">{z}</option>)}
              </select>
            </div>
            <ArrowRight size={18} className="text-white/30 shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-white/50 text-xs mb-1">
                <MapPin size={12} className="text-red-400" />
                Tujuan
              </div>
              <select
                value={destAddress}
                onChange={e => setDestAddress(e.target.value)}
                className="w-full bg-transparent text-white font-semibold text-sm focus:outline-none"
              >
                {ZONES.map(z => <option key={z} value={z} className="text-gray-900">{z}</option>)}
              </select>
            </div>
          </div>

          {/* Live price preview */}
          {preview && (
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Navigation size={14} className="text-white/50" />
                <span className="text-white/70">{preview.distance_km} km</span>
                <span className="text-white/30">·</span>
                <Clock size={14} className="text-white/50" />
                <span className="text-white/70">~{preview.eta} min</span>
              </div>
              <span className="font-bold text-green-300 text-lg">
                {formatIDR(preview.price)}
              </span>
            </div>
          )}
          {geoLoading && (
            <div className="mt-2 text-xs text-white/40 flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" /> Menghitung...
            </div>
          )}
        </div>
      </div>

      {/* Form cards */}
      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4 pb-24">
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* Sender info */}
        <div className="card space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Data Pengirim</p>
          <div className="flex items-center gap-3">
            <User size={18} className="text-gray-400 shrink-0" />
            <input
              className="input flex-1"
              placeholder="Nama Anda"
              value={senderName}
              onChange={e => setSenderName(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-gray-400 shrink-0" />
            <input
              className="input flex-1"
              placeholder="WhatsApp (08xx)"
              value={senderPhone}
              onChange={e => setSenderPhone(e.target.value)}
              type="tel"
              required
            />
          </div>
        </div>

        {/* Recipient info */}
        <div className="card space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Data Penerima</p>
          <div className="flex items-center gap-3">
            <User size={18} className="text-gray-400 shrink-0" />
            <input
              className="input flex-1"
              placeholder="Nama Penerima"
              value={recipientName}
              onChange={e => setRecipientName(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-gray-400 shrink-0" />
            <input
              className="input flex-1"
              placeholder="WhatsApp Penerima (opsional)"
              value={recipientPhone}
              onChange={e => setRecipientPhone(e.target.value)}
              type="tel"
            />
          </div>
        </div>

        {/* Package info */}
        <div className="card space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Detail Pengiriman</p>
          <div className="flex items-center gap-3">
            <Package size={18} className="text-gray-400 shrink-0" />
            <input
              className="input flex-1"
              placeholder="Jenis barang (contoh: Dokumen, Makanan)"
              value={itemDescription}
              onChange={e => setItemDescription(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-gray-400 shrink-0" />
            <textarea
              className="input flex-1 resize-none"
              placeholder="Catatan tambahan..."
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Sticky CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t border-gray-100">
          <button
            type="submit"
            disabled={step === 'submitting'}
            className="w-full btn-primary py-4 text-lg font-bold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {step === 'submitting' ? (
              <><Loader2 size={22} className="animate-spin" /> Membuat Order...</>
            ) : (
              <><Package size={22} /> Pesan Sekarang</>
            )}
          </button>
          {preview && (
            <p className="text-xs text-gray-400 text-center mt-2">
              Estimasi ongkir: {formatIDR(preview.price)} · {preview.distance_km} km · ±{preview.eta} menit
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
