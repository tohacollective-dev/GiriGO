'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Package, MapPin, User, Phone, FileText, Navigation,
  Loader2, CheckCircle, ArrowRight, Clock, Truck,
  ChevronDown, AlertCircle, ShieldCheck, AlertTriangle,
} from 'lucide-react'
import { formatIDR } from '@/lib/pricing'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'
import type { PlaceResult } from '@/hooks/useGoogleMaps'

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
  { value: 'Dokumen',   label: 'Dokumen / Surat',   weight: 0.2 },
  { value: 'Makanan',   label: 'Makanan & Minuman', weight: 0.5 },
  { value: 'Paket Kecil',  label: 'Paket Kecil (< 1 kg)',  weight: 0.8 },
  { value: 'Paket Sedang', label: 'Paket Sedang (1-3 kg)', weight: 2.0 },
  { value: 'Paket Besar',  label: 'Paket Besar (3-5 kg)',  weight: 4.0 },
  { value: 'Lainnya',   label: 'Barang Lainnya',    weight: 1.0 },
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

// Haversine distance for client-side estimation
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Types ───────────────────────────────────────────────────────────────────
type FieldErrors = Record<string, string>

interface PreviewState {
  distance_km: number; price: number; eta: number
  pickup_lat?: number; pickup_lng?: number
  dropoff_lat?: number; dropoff_lng?: number
  pickup_display?: string; dropoff_display?: string
}

// ── Route preview mini-map ──────────────────────────────────────────────────
function RoutePreview({ preview }: { preview: PreviewState }) {
  const hasCoords = preview.pickup_lat != null && preview.pickup_lng != null &&
                    preview.dropoff_lat != null && preview.dropoff_lng != null
  if (!hasCoords) return null

  const pad = 40
  const w = 320, h = 160
  const latMin = Math.min(preview.pickup_lat!, preview.dropoff_lat!)
  const latMax = Math.max(preview.pickup_lat!, preview.dropoff_lat!)
  const lngMin = Math.min(preview.pickup_lng!, preview.dropoff_lng!)
  const lngMax = Math.max(preview.pickup_lng!, preview.dropoff_lng!)
  const latR = latMax - latMin || 0.01
  const lngR = lngMax - lngMin || 0.01

  const toX = (lng: number) => pad + ((lng - lngMin) / lngR) * (w - pad * 2)
  const toY = (lat: number) => pad + (1 - (lat - latMin) / latR) * (h - pad * 2)

  const x1 = toX(preview.pickup_lng!), y1 = toY(preview.pickup_lat!)
  const x2 = toX(preview.dropoff_lng!), y2 = toY(preview.dropoff_lat!)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        <Navigation size={14} className="text-brand-500" />
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Rute Pengiriman</span>
        <span className="ml-auto text-[10px] text-gray-400">
          {preview.distance_km} km · {formatIDR(preview.price)}
        </span>
      </div>
      <div className="p-3 flex justify-center">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[320px] h-auto rounded-lg bg-[#F8FAFC]">
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94A3B8" strokeWidth="2" strokeDasharray="6,3" />
          <circle cx={x1} cy={y1} r="10" fill="#22C55E" stroke="white" strokeWidth="2" />
          <text x={x1} y={y1 + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">A</text>
          <circle cx={x2} cy={y2} r="10" fill="#EF4444" stroke="white" strokeWidth="2" />
          <text x={x2} y={y2 + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">B</text>
          <text x={x1} y={y1 - 16} textAnchor="middle" fill="#64748B" fontSize="9" fontWeight="600">
            {truncate(preview.pickup_display ?? 'Jemput', 20)}
          </text>
          <text x={x2} y={y2 - 16} textAnchor="middle" fill="#64748B" fontSize="9" fontWeight="600">
            {truncate(preview.dropoff_display ?? 'Tujuan', 20)}
          </text>
        </svg>
      </div>
    </div>
  )
}

function truncate(s: string, len: number) {
  return s.length > len ? s.slice(0, len - 1) + '…' : s
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
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

  // Refs for Google Maps autocomplete
  const pickupInputRef = useRef<HTMLInputElement>(null)
  const destInputRef   = useRef<HTMLInputElement>(null)

  // Track whether autocomplete has been bound
  const [pickupAutocompleteBound, setPickupAutocompleteBound] = useState(false)
  const [destAutocompleteBound,   setDestAutocompleteBound]   = useState(false)

  // Preview
  const [geoLoading, setGeoLoading] = useState(false)
  const [preview,    setPreview]    = useState<PreviewState | null>(null)

  // Success
  const [result, setResult] = useState<{
    order_code: string; courier_name?: string; courier_phone?: string
    pickup?: string; dest?: string; fee?: number; km?: number
  } | null>(null)

  // Track lat/lng from Places API
  const [pickupPlace, setPickupPlace] = useState<{lat:number;lng:number;display:string}|null>(null)
  const [destPlace,   setDestPlace]   = useState<{lat:number;lng:number;display:string}|null>(null)

  // Refs to capture latest preview state for stale closure safety
  const destPlaceRef = useRef(destPlace)
  destPlaceRef.current = destPlace
  const pickupPlaceRef = useRef(pickupPlace)
  pickupPlaceRef.current = pickupPlace

  const recalcPreview = useCallback((p: {lat:number;lng:number;display:string}|null,
                          d: {lat:number;lng:number;display:string}|null) => {
    if (p && d) {
      const km = Math.round(haversineKm(p.lat, p.lng, d.lat, d.lng) * 10) / 10
      setPreview({
        distance_km: km, price: calcPrice(km), eta: calcEta(km),
        pickup_lat: p.lat, pickup_lng: p.lng,
        dropoff_lat: d.lat, dropoff_lng: d.lng,
        pickup_display: p.display, dropoff_display: d.display,
      })
    }
  }, [])

  const updatePreviewForPickup = useCallback((place: PlaceResult) => {
    setPickupPlace({ lat: place.lat, lng: place.lng, display: place.display_name })
    recalcPreview({ lat: place.lat, lng: place.lng, display: place.display_name }, destPlaceRef.current)
  }, [recalcPreview])

  const updatePreviewForDest = useCallback((place: PlaceResult) => {
    setDestPlace({ lat: place.lat, lng: place.lng, display: place.display_name })
    recalcPreview(pickupPlaceRef.current, { lat: place.lat, lng: place.lng, display: place.display_name })
  }, [recalcPreview])

  // Google Maps
  const { placesReady, mapsError, mapsLoading, initAutocomplete } = useGoogleMaps()

  // Stash latest callbacks in refs for the autocomplete useEffect
  const onPickupPlaceRef = useRef(updatePreviewForPickup)
  onPickupPlaceRef.current = updatePreviewForPickup
  const onDestPlaceRef = useRef(updatePreviewForDest)
  onDestPlaceRef.current = updatePreviewForDest

  // ── Bind autocomplete when Places API is ready ──────────────────────────────
  useEffect(() => {
    if (!placesReady) return

    if (!pickupAutocompleteBound && pickupInputRef.current) {
      const instance = initAutocomplete(pickupInputRef.current, (place: PlaceResult) => {
        setPickupAddress(place.display_name)
        onPickupPlaceRef.current(place)
      })
      if (instance) setPickupAutocompleteBound(true)
    }

    if (!destAutocompleteBound && destInputRef.current) {
      const instance = initAutocomplete(destInputRef.current, (place: PlaceResult) => {
        setDestAddress(place.display_name)
        onDestPlaceRef.current(place)
      })
      if (instance) setDestAutocompleteBound(true)
    }
  }, [placesReady, pickupAutocompleteBound, destAutocompleteBound, initAutocomplete])

  // ── Zone-based fallback pricing ──────────────────────────────────────────────
  const effectivePickup = pickupAddress || pickupZone || 'Gerung Kota'
  const effectiveDest   = destAddress   || destZone   || 'Dasan Baru'

  useEffect(() => {
    if (pickupPlace && destPlace) return

    const km = lookupKm(effectivePickup, effectiveDest)
    if (km === null) { setPreview(null); return }
    setPreview({
      distance_km: km, price: calcPrice(km), eta: calcEta(km),
      pickup_display: effectivePickup, dropoff_display: effectiveDest,
    })
    geocodeAddresses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectivePickup, effectiveDest, pickupPlace, destPlace])

  const geocodeAddresses = useCallback(async () => {
    if (pickupPlace && destPlace) return

    // Guard: don't call geocode with addresses that will fail validation (min 3 chars)
    const pAddr = effectivePickup.trim()
    const dAddr = effectiveDest.trim()
    if (pAddr.length < 3 || dAddr.length < 3) return

    setGeoLoading(true)
    try {
      const res = await fetch('/api/geocode', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup_address: pAddr,
          dropoff_address: dAddr,
          weight_kg: PACKAGE_TYPES.find(p => p.value === packageType)?.weight ?? 1.0,
        }),
      })
      if (!res.ok) return
      const data = await res.json()
      setPreview(prev => {
        if (!prev) return null
        const newPickupLat  = data.pickup?.lat  ?? pickupPlace?.lat ?? prev.pickup_lat
        const newPickupLng  = data.pickup?.lng  ?? pickupPlace?.lng ?? prev.pickup_lng
        const newDropoffLat = data.dropoff?.lat ?? destPlace?.lat   ?? prev.dropoff_lat
        const newDropoffLng = data.dropoff?.lng ?? destPlace?.lng   ?? prev.dropoff_lng
        return {
          ...prev,
          distance_km:     data.distance_km ?? prev.distance_km,
          price:           data.pricing?.delivery_fee ?? prev.price,
          pickup_lat:      newPickupLat, pickup_lng: newPickupLng,
          dropoff_lat:     newDropoffLat, dropoff_lng: newDropoffLng,
          pickup_display:  data.pickup?.display_name ?? prev.pickup_display,
          dropoff_display: data.dropoff?.display_name ?? prev.dropoff_display,
        }
      })
    } finally { setGeoLoading(false) }
  }, [effectivePickup, effectiveDest, packageType, pickupPlace, destPlace])

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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name:   senderName.trim(),
          customer_phone:  senderPhone.trim(),
          pickup_address:  pickupAddress.trim() || effectivePickup,
          dropoff_address: destAddress.trim()    || effectiveDest,
          pickup_lat:      preview?.pickup_lat   ?? pickupPlace?.lat  ?? 0,
          pickup_lng:      preview?.pickup_lng   ?? pickupPlace?.lng  ?? 0,
          dropoff_lat:     preview?.dropoff_lat  ?? destPlace?.lat    ?? 0,
          dropoff_lng:     preview?.dropoff_lng  ?? destPlace?.lng    ?? 0,
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

  const inputCls = (field: string) =>
    `w-full px-4 py-3.5 rounded-xl border text-sm transition-colors outline-none ${
      errors[field]
        ? 'border-red-300 bg-red-50 focus:border-red-400'
        : 'border-gray-200 bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100'
    }`

  // ═══════════════════════════════════════════════════════════════════════════
  // SUCCESS
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'success' && result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-900 via-brand-800 to-brand-900 flex flex-col items-center justify-center px-5 py-12 text-white">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-400/30">
              <CheckCircle size={40} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold">Order Berhasil!</h1>
            <p className="text-white/60 text-sm mt-1">Kurir akan segera dijadwalkan</p>
          </div>
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
                  <div><p className="text-xs text-white/40">Jemput</p><p className="text-sm font-medium">{result.pickup}</p></div>
                </div>
                <div className="w-px h-4 bg-white/20 ml-1" />
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-400 mt-2 shrink-0" />
                  <div><p className="text-xs text-white/40">Tujuan</p><p className="text-sm font-medium">{result.dest}</p></div>
                </div>
              </div>
            )}
            {(result.km || result.fee) && (
              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-sm">
                <span className="text-white/50">{result.km ? `${result.km} km` : ''}</span>
                <span className="font-bold text-green-300 text-lg">{result.fee ? formatIDR(result.fee) : ''}</span>
              </div>
            )}
            {result.courier_name && (
              <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Truck size={20} className="text-green-300" />
                </div>
                <div><p className="text-xs text-white/40">Kurir Ditugaskan</p><p className="font-semibold">{result.courier_name}</p>
                  {result.courier_phone && (
                    <a href={`https://wa.me/${result.courier_phone.replace(/\D/g, '')}`}
                       className="text-xs text-green-300 hover:underline" target="_blank" rel="noopener noreferrer">
                      {result.courier_phone.replace(/^62/, '0')}</a>)}
                </div>
              </div>
            )}
          </div>
          <a href={`/tracking/${result.order_code}`}
             className="w-full py-4 bg-brand-500 hover:bg-brand-400 text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand-500/25">
            <Clock size={22} /> Lacak Pesanan
          </a>
          <a href="/order" className="block text-center text-sm text-white/50 hover:text-white/70 py-2">Buat Order Baru</a>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FORM
  // ═══════════════════════════════════════════════════════════════════════════
  const showMapsWarning = mapsError && !pickupPlace && !destPlace

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Header */}
      <div className="bg-brand-900 text-white px-5 pt-8 pb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">&#x1F6F5;</span>
            <div><h1 className="text-xl font-bold">GiriGo Courier</h1><p className="text-white/50 text-xs">Gerung, Lombok Barat</p></div>
          </div>
          <p className="text-white/70 text-sm mt-3">Isi form di bawah, kurir kami siap antar</p>
        </div>
      </div>

      {/* Maps error warning */}
      {showMapsWarning && (
        <div className="px-4 mt-3">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-3">
            <AlertTriangle size={18} className="text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700">Alamat otomatis tidak tersedia. Silakan gunakan pilihan zona manual.</p>
          </div>
        </div>
      )}

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
              <p className="text-sm text-gray-400">Pilih zona atau ketik alamat untuk estimasi</p>
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

        {/* ── Pengirim ──────────────────────────────────────────────────────── */}
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

        {/* ── Alamat Penjemputan ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <MapPin size={15} className="text-green-500" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Alamat Penjemputan</span>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Zona</label>
              <div className="relative">
                <select className={`${inputCls('')} appearance-none pr-10`} value={pickupZone}
                        onChange={e => { setPickupZone(e.target.value); setPickupAddress(''); setPickupPlace(null) }}>
                  <option value="">Pilih zona...</option>
                  {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Atau ketik alamat
                {mapsLoading && <Loader2 size={10} className="inline ml-1 animate-spin text-gray-400" />}
                {placesReady && !pickupAutocompleteBound && <Loader2 size={10} className="inline ml-1 animate-spin text-brand-400" />}
              </label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400" />
                <input ref={pickupInputRef} className={`${inputCls('')} pl-9`}
                       placeholder={mapsError ? "Ketik alamat manual..." : "Jl. Gajah Mada No.5, Gerung..."}
                       value={pickupAddress}
                       onChange={e => { setPickupAddress(e.target.value); setPickupZone('') }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Penerima ──────────────────────────────────────────────────────── */}
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

        {/* ── Route preview ── */}
        {preview && <RoutePreview preview={preview} />}

        {/* ── Alamat Tujuan ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <MapPin size={15} className="text-red-500" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Alamat Tujuan</span>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Zona</label>
              <div className="relative">
                <select className={`${inputCls('')} appearance-none pr-10`} value={destZone}
                        onChange={e => { setDestZone(e.target.value); setDestAddress(''); setDestPlace(null) }}>
                  <option value="">Pilih zona...</option>
                  {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Atau ketik alamat
                {mapsLoading && <Loader2 size={10} className="inline ml-1 animate-spin text-gray-400" />}
                {placesReady && !destAutocompleteBound && <Loader2 size={10} className="inline ml-1 animate-spin text-brand-400" />}
              </label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400" />
                <input ref={destInputRef} className={`${inputCls('')} pl-9`}
                       placeholder={mapsError ? "Ketik alamat manual..." : "Jl. Sudirman No.10, Kediri..."}
                       value={destAddress}
                       onChange={e => { setDestAddress(e.target.value); setDestZone('') }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Detail Paket ──────────────────────────────────────────────────── */}
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

        <div className="h-4" />
      </form>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur border-t border-gray-100 z-50">
        <button onClick={handleSubmit} disabled={step === 'submitting'}
                className="w-full bg-brand-500 hover:bg-brand-600 active:bg-brand-700 disabled:bg-brand-300 text-white font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-brand-500/25 active:scale-[0.98]">
          {step === 'submitting' ? (
            <><Loader2 size={22} className="animate-spin" /> Membuat Order...</>
          ) : (
            <><Truck size={22} /> Pesan Kurir Sekarang</>
          )}
        </button>
        {preview && (
          <p className="text-xs text-gray-400 text-center mt-2 flex items-center justify-center gap-1.5 flex-wrap">
            <ShieldCheck size={12} className="text-green-500" />
            <span>Estimasi ongkir <strong className="text-gray-600">{formatIDR(preview.price)}</strong></span>
            <span className="text-gray-300">·</span>
            <span>{preview.distance_km} km</span>
            <span className="text-gray-300">·</span>
            <span>±{preview.eta} mnt</span>
            {preview.pickup_lat && preview.dropoff_lat && (
              <span className="text-[10px] text-green-500">GPS ready</span>
            )}
          </p>
        )}
      </div>
    </div>
  )
}
