'use client'
import { useEffect, useState, useCallback } from 'react'
import { MapPin, Navigation, Camera, CheckCircle, DollarSign, Power, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react'
import { formatIDR } from '@/lib/pricing'
import { generateNavLink } from '@/lib/maps'
import type { Order } from '@/types'

// Courier PWA — mobile-first job management page
// In production: courier_id comes from auth session
// For MVP: stored in localStorage after admin registers courier

export default function CourierPWA() {
  const [courierId,    setCourierId]    = useState<string | null>(null)
  const [status,       setStatus]       = useState<'online' | 'offline'>('offline')
  const [activeOrder,  setActiveOrder]  = useState<Order | null>(null)
  const [earnings,     setEarnings]     = useState({ today: 0, week: 0, orders: 0 })
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [updating,     setUpdating]     = useState(false)

  const fetchActiveOrder = useCallback(async (id: string) => {
    try {
      const res  = await fetch(`/api/orders?status=assigned&courier_id=${encodeURIComponent(id)}&limit=5`)
      if (!res.ok) throw new Error('Gagal mengambil order')
      const data = await res.json()
      const mine = (data.data ?? []).find((o: Order) => o.courier_id === id)
      setActiveOrder(mine ?? null)
    } catch {
      // keep stale data on error
    }
  }, [])

  const fetchEarnings = useCallback(async (cid: string) => {
    try {
      const res  = await fetch(`/api/analytics`)
      if (!res.ok) throw new Error('Gagal mengambil data')
      const data = await res.json()
      const me   = (data.couriers ?? []).find((c: any) =>
        c.courier_id === cid || c.id === cid
      )
      if (me) {
        setEarnings({
          today:  me.today_earnings  ?? 0,
          week:   me.week_earnings   ?? 0,
          orders: me.total_orders    ?? 0,
        })
      }
    } catch {
      // keep stale data on error
    }
  }, [])

  const fetchAll = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchActiveOrder(id), fetchEarnings(id)])
    } catch {
      setError('Gagal menghubungi server.')
    } finally {
      setLoading(false)
    }
  }, [fetchActiveOrder, fetchEarnings])

  // Load courier ID from localStorage
  useEffect(() => {
    const id = localStorage.getItem('girigoCourierId')
    setCourierId(id)
    if (id) fetchAll(id)
  }, [fetchAll])

  // Periodic refresh when online
  useEffect(() => {
    if (!courierId || status !== 'online') return
    const interval = setInterval(() => fetchAll(courierId), 30_000)
    return () => clearInterval(interval)
  }, [courierId, status, fetchAll])

  // GPS watchdog — updates location every 60s when online
  useEffect(() => {
    if (status !== 'online' || !courierId) return

    const sendLocation = () => {
      if (!navigator.geolocation) return
      navigator.geolocation.getCurrentPosition(
        pos => {
          fetch('/api/courier/status', {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              courier_id: courierId,
              status:     'online',
              lat:        pos.coords.latitude,
              lng:        pos.coords.longitude,
            }),
          }).catch(() => {})
        },
        () => {} // silently ignore GPS errors for background updates
      )
    }

    sendLocation() // send immediately
    const interval = setInterval(sendLocation, 60_000)
    return () => clearInterval(interval)
  }, [status, courierId])

  async function toggleOnline() {
    if (!courierId) return
    setUpdating(true)

    const newStatus = status === 'online' ? 'offline' : 'online'

    let lat: number | undefined
    let lng: number | undefined
    if (newStatus === 'online' && navigator.geolocation) {
      await new Promise<void>(resolve => {
        navigator.geolocation.getCurrentPosition(
          pos => { lat = pos.coords.latitude; lng = pos.coords.longitude; resolve() },
          () => resolve()
        )
      })
    }

    try {
      const res = await fetch('/api/courier/status', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ courier_id: courierId, status: newStatus, lat, lng }),
      })
      if (!res.ok) throw new Error('Gagal update status')
      setStatus(newStatus)
    } catch {
      setError('Gagal mengubah status. Coba lagi.')
    } finally {
      setUpdating(false)
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: 'picked_up' | 'delivered') {
    setUpdating(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Gagal update order')
      if (newStatus === 'delivered') {
        setActiveOrder(null)
        await fetchEarnings(courierId!)
      } else {
        setActiveOrder(prev => prev ? { ...prev, status: newStatus } : null)
      }
    } catch {
      setError('Gagal update order. Coba lagi.')
    } finally {
      setUpdating(false)
    }
  }

  // ─── No courier ID — enter ID screen ───────────────────────────────────────

  if (!courierId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-900 p-6">
        <div className="text-center text-white w-full max-w-xs">
          <p className="text-6xl mb-4">🛵</p>
          <h1 className="text-2xl font-bold mb-2">GiriGo Courier</h1>
          <p className="text-white/70 mb-4">Masukkan Courier ID Anda untuk mulai</p>
          <input
            className="w-full px-4 py-3 rounded-xl text-gray-900 text-center font-mono"
            placeholder="Courier ID (UUID)"
            onBlur={e => {
              const v = e.target.value.trim()
              if (v) {
                localStorage.setItem('girigoCourierId', v)
                setCourierId(v)
                fetchAll(v) // immediately fetch after entering ID
              }
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const v = e.currentTarget.value.trim()
                if (v) {
                  localStorage.setItem('girigoCourierId', v)
                  setCourierId(v)
                  fetchAll(v)
                }
              }
            }}
          />
          <p className="text-white/40 text-xs mt-3">
            ID diberikan oleh admin GiriGo saat pendaftaran
          </p>
        </div>
      </div>
    )
  }

  // ─── Dashboard ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-100 max-w-sm mx-auto">
      {/* Header */}
      <div className="bg-brand-900 text-white px-5 pt-8 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">🛵 GiriGo Courier</h1>
            <p className="text-white/60 text-sm">Dashboard Kurir</p>
          </div>
          <button
            onClick={toggleOnline}
            disabled={updating}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              status === 'online'
                ? 'bg-green-400 text-green-900'
                : 'bg-white/20 text-white'
            }`}
          >
            {updating ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
            {status === 'online' ? 'Online' : 'Offline'}
          </button>
        </div>

        {/* Earnings */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: 'Hari Ini', value: formatIDR(earnings.today) },
            { label: 'Minggu Ini', value: formatIDR(earnings.week) },
            { label: 'Total Order', value: earnings.orders.toString() },
          ].map(e => (
            <div key={e.label} className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-base">{e.value}</p>
              <p className="text-white/60 text-xs mt-0.5">{e.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-4 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button
            onClick={() => { setError(null); fetchAll(courierId) }}
            className="text-xs font-semibold text-red-600 hover:text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Active Order Card */}
      <div className="p-4">
        {loading ? (
          <div className="card text-center py-10 space-y-4">
            <Loader2 size={32} className="animate-spin text-brand-500 mx-auto" />
            <p className="text-sm text-gray-400">Memuat data...</p>
          </div>
        ) : !activeOrder ? (
          <div className="card text-center py-10">
            <p className="text-4xl mb-3">⏳</p>
            <p className="font-semibold text-gray-700">
              {status === 'online' ? 'Menunggu order...' : 'Anda sedang Offline'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {status === 'online'
                ? 'Order akan muncul otomatis via WhatsApp'
                : 'Aktifkan Online untuk menerima order'}
            </p>
            <button
              onClick={() => courierId && fetchAll(courierId)}
              className="mt-4 text-sm text-brand-500 hover:text-brand-700 font-medium flex items-center justify-center gap-1"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono font-bold text-brand-500">{activeOrder.order_code}</span>
                <span className={`badge badge-${activeOrder.status}`}>{activeOrder.status}</span>
              </div>

              {/* Addresses */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-green-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Pickup</p>
                    <p className="text-sm font-medium">{activeOrder.pickup_address}</p>
                  </div>
                  {activeOrder.pickup_lat && activeOrder.pickup_lng && (
                    <a
                      href={generateNavLink(activeOrder.pickup_lat, activeOrder.pickup_lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-brand-50 rounded-lg"
                    >
                      <Navigation size={16} className="text-brand-500" />
                    </a>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-red-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Dropoff</p>
                    <p className="text-sm font-medium">{activeOrder.dropoff_address}</p>
                  </div>
                  {activeOrder.dropoff_lat && activeOrder.dropoff_lng && (
                    <a
                      href={generateNavLink(activeOrder.dropoff_lat, activeOrder.dropoff_lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-brand-50 rounded-lg"
                    >
                      <Navigation size={16} className="text-brand-500" />
                    </a>
                  )}
                </div>
              </div>

              {/* Fee */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-green-600">
                  <DollarSign size={16} />
                  <span className="font-bold">{formatIDR(Math.floor(activeOrder.delivery_fee * 0.85))}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {activeOrder.distance_km} km · {activeOrder.payment_method.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {activeOrder.status === 'assigned' && (
              <button
                onClick={() => updateOrderStatus(activeOrder.id, 'picked_up')}
                disabled={updating}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                {updating ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                Konfirmasi Pickup
              </button>
            )}

            {activeOrder.status === 'picked_up' && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 text-center">Upload foto bukti pengiriman sebelum selesai</p>
                <button
                  onClick={() => updateOrderStatus(activeOrder.id, 'delivered')}
                  disabled={updating}
                  className="w-full bg-green-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  {updating ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  Tandai Terkirim
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
