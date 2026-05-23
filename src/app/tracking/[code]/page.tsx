'use client'
import { useEffect, useState } from 'react'
import { use } from 'react'
import { CheckCircle, Clock, Package, MapPin, Truck } from 'lucide-react'
import { formatIDR } from '@/lib/pricing'

interface TrackingData {
  order_code:      string
  status:          string
  item_type:       string
  pickup_address:  string
  dropoff_address: string
  distance_km:     number
  delivery_fee:    number
  payment_method:  string
  courier_name:    string | null
  courier_lat:     number | null
  courier_lng:     number | null
  courier_rating:  number | null
  timeline: {
    ordered:   string | null
    assigned:  string | null
    picked_up: string | null
    delivered: string | null
  }
}

const STATUS_STEPS = [
  { key: 'pending',   label: 'Order Diterima',  icon: Package },
  { key: 'assigned',  label: 'Kurir Ditemukan', icon: Truck },
  { key: 'picked_up', label: 'Barang Dijemput',  icon: MapPin },
  { key: 'delivered', label: 'Terkirim!',         icon: CheckCircle },
]

const STATUS_ORDER = ['pending', 'assigned', 'picked_up', 'delivered']

function fmt(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

export default function TrackingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const [data,    setData]    = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!code) return

    const fetchTracking = async () => {
      try {
        const res = await fetch(`/api/tracking/${code}`)
        if (!res.ok) { setError('Order tidak ditemukan'); setLoading(false); return }
        const json = await res.json()
        setData(json)
        setLoading(false)
      } catch {
        setError('Gagal memuat data tracking')
        setLoading(false)
      }
    }

    fetchTracking()
    const interval = setInterval(fetchTracking, 15000)  // auto-refresh every 15s
    return () => clearInterval(interval)
  }, [code])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500 mx-auto" />
          <p className="text-gray-500 mt-3 text-sm">Memuat tracking...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <p className="text-4xl mb-3">📦</p>
          <h2 className="text-xl font-bold text-gray-800">Order Tidak Ditemukan</h2>
          <p className="text-gray-500 mt-2">{error ?? 'Periksa kembali kode order Anda'}</p>
        </div>
      </div>
    )
  }

  const currentStep = STATUS_ORDER.indexOf(data.status)
  const isDelivered = data.status === 'delivered'
  const isCancelled = data.status === 'cancelled' || data.status === 'failed'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`px-5 pt-10 pb-8 text-white ${isDelivered ? 'bg-success-500' : isCancelled ? 'bg-danger-500' : 'bg-brand-900'}`}>
        <p className="text-xs font-medium uppercase tracking-wider opacity-70">GiriGo Tracking</p>
        <h1 className="text-2xl font-bold mt-1">{data.order_code}</h1>
        <p className="text-sm opacity-80 mt-1">{data.item_type}</p>
        {isDelivered && <p className="mt-2 text-lg font-semibold">✅ Paket Telah Terkirim!</p>}
        {isCancelled && <p className="mt-2 text-lg font-semibold">❌ Order Dibatalkan</p>}
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Progress steps */}
        {!isCancelled && (
          <div className="card">
            <div className="space-y-0">
              {STATUS_STEPS.map((step, i) => {
                const done    = i <= currentStep
                const current = i === currentStep
                const Icon    = step.icon
                return (
                  <div key={step.key} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        done ? 'bg-brand-500' : 'bg-gray-100'
                      }`}>
                        <Icon size={15} className={done ? 'text-white' : 'text-gray-400'} />
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`w-0.5 h-8 mt-1 ${done && i < currentStep ? 'bg-brand-500' : 'bg-gray-100'}`} />
                      )}
                    </div>
                    <div className="pt-1 pb-6">
                      <p className={`text-sm font-medium ${done ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                        {current && !isDelivered && (
                          <span className="ml-2 inline-block w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                        )}
                      </p>
                      {data.timeline[step.key as keyof typeof data.timeline] && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {fmt(data.timeline[step.key as keyof typeof data.timeline])}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Courier info */}
        {data.courier_name && (
          <div className="card flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-500 font-bold">
              {data.courier_name[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{data.courier_name}</p>
              <p className="text-xs text-gray-400">Kurir GiriGo</p>
            </div>
            {data.courier_rating && (
              <div className="text-yellow-500 font-semibold text-sm">
                ⭐ {data.courier_rating}
              </div>
            )}
          </div>
        )}

        {/* Order details */}
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-800 text-sm">Detail Pengiriman</h3>
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-gray-400 w-16 shrink-0">Dari</span>
              <span className="text-gray-700">{data.pickup_address}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400 w-16 shrink-0">Ke</span>
              <span className="text-gray-700">{data.dropoff_address}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400 w-16 shrink-0">Jarak</span>
              <span className="text-gray-700">{data.distance_km} km</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400 w-16 shrink-0">Ongkir</span>
              <span className="font-semibold text-gray-900">{formatIDR(data.delivery_fee)}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400 w-16 shrink-0">Bayar</span>
              <span className="uppercase text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded">
                {data.payment_method}
              </span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          🔄 Auto-refresh setiap 15 detik · GiriGo Courier
        </p>
      </div>
    </div>
  )
}
