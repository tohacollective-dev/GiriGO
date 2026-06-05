'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  MapPin, Navigation, CheckCircle, DollarSign, Power,
  AlertTriangle, RefreshCw, Loader2, ChevronRight, Wifi,
  WifiOff, Navigation2, Clock, User, Phone, Package,
} from 'lucide-react'
import { formatIDR } from '@/lib/pricing'
import { generateNavLink } from '@/lib/maps'
import type { Order } from '@/types'

// ── Courier PWA v3 — multi-order dashboard, 30s GPS, location error handling ──

export default function CourierPWA() {
  const [courierId,   setCourierId]   = useState<string | null>(null)
  const [status,      setStatus]      = useState<'online' | 'offline'>('offline')
  const [orders,      setOrders]      = useState<Order[]>([])
  const [earnings,    setEarnings]    = useState({ today: 0, total: 0, completed: 0, active: 0 })
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [updating,    setUpdating]    = useState(false)
  const [expandedId,  setExpandedId]  = useState<string | null>(null)

  // GPS state
  const [gpsStatus,    setGpsStatus]    = useState<'idle' | 'acquiring' | 'active' | 'denied' | 'error'>('idle')
  const [lastGpsTime,  setLastGpsTime]  = useState<Date | null>(null)
  const gpsIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef     = useRef(true)

  // Cleanup on unmount
  useEffect(() => { return () => { mountedRef.current = false } }, [])

  // ── Fetch active orders (assigned + picked_up) ──────────────────────────────
  const fetchOrders = useCallback(async (id: string) => {
    try {
      const res  = await fetch(`/api/orders?status=assigned&courier_id=${encodeURIComponent(id)}&limit=20`)
      if (!res.ok) return
      const data = await res.json()
      // Also get picked_up orders
      const res2 = await fetch(`/api/orders?status=picked_up&courier_id=${encodeURIComponent(id)}&limit=20`)
      if (res2.ok) {
        const data2 = await res2.json()
        setOrders([...(data2.data ?? []), ...(data.data ?? [])].filter(
          (o: Order) => o.courier_id === id
        ))
      } else {
        setOrders((data.data ?? []).filter((o: Order) => o.courier_id === id))
      }
    } catch { /* stale on error */ }
  }, [])

  // ── Fetch earnings ──────────────────────────────────────────────────────────
  const fetchEarnings = useCallback(async (cid: string) => {
    try {
      const res  = await fetch(`/api/courier/earnings?courier_id=${encodeURIComponent(cid)}`)
      if (!res.ok) return
      const data = await res.json()
      setEarnings({
        today:     data.courier_share_today ?? 0,
        total:     data.total_earnings    ?? 0,
        completed: data.completed_orders  ?? 0,
        active:    data.active_orders     ?? 0,
      })
    } catch { /* stale on error */ }
  }, [])

  const fetchAll = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchOrders(id), fetchEarnings(id)])
    } catch {
      setError('Gagal menghubungi server.')
    } finally {
      setLoading(false)
    }
  }, [fetchOrders, fetchEarnings])

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = localStorage.getItem('girigoCourierId')
    setCourierId(id)
    if (id) fetchAll(id)
  }, [fetchAll])

  // ── Periodic refresh ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!courierId || status !== 'online') return
    const interval = setInterval(() => fetchAll(courierId), 30_000)
    return () => clearInterval(interval)
  }, [courierId, status, fetchAll])

  // ── GPS watchdog — 30s interval ─────────────────────────────────────────────
  const sendGpsUpdate = useCallback(async (id: string, lat: number, lng: number) => {
    try {
      await fetch('/api/courier/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courier_id: id, status: 'online', lat, lng }),
      })
      setLastGpsTime(new Date())
      setGpsStatus('active')
    } catch { /* non-critical */ }
  }, [])

  const requestGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('error')
      return
    }

    setGpsStatus('acquiring')

    navigator.geolocation.getCurrentPosition(
      pos => {
        if (!mountedRef.current || !courierId) return
        sendGpsUpdate(courierId, pos.coords.latitude, pos.coords.longitude)
      },
      err => {
        if (!mountedRef.current) return
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('denied')
        } else {
          setGpsStatus('error')
        }
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    )
  }, [courierId, sendGpsUpdate])

  // Start/stop GPS watchdog based on online status
  useEffect(() => {
    if (status !== 'online' || !courierId) {
      if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current)
      if (status === 'offline') setGpsStatus('idle')
      return
    }

    requestGps() // immediate
    gpsIntervalRef.current = setInterval(requestGps, 30_000)

    return () => {
      if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current)
    }
  }, [status, courierId, requestGps])

  // ── Toggle online/offline ───────────────────────────────────────────────────
  async function toggleOnline() {
    if (!courierId) return
    setUpdating(true)
    const newStatus = status === 'online' ? 'offline' : 'online'

    if (newStatus === 'online') {
      // Try to get GPS immediately
      if (navigator.geolocation) {
        await new Promise<void>(resolve => {
          navigator.geolocation.getCurrentPosition(
            async pos => {
              if (mountedRef.current) {
                await sendGpsUpdate(courierId!, pos.coords.latitude, pos.coords.longitude)
              }
              resolve()
            },
            () => resolve(),
            { enableHighAccuracy: true, timeout: 10_000 },
          )
        })
      }
    }

    try {
      const res = await fetch('/api/courier/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courier_id: courierId, status: newStatus }),
      })
      if (!res.ok) throw new Error('Gagal')
      setStatus(newStatus)
      if (newStatus === 'offline') setGpsStatus('idle')
    } catch {
      setError('Gagal mengubah status. Coba lagi.')
    } finally {
      setUpdating(false)
    }
  }

  // ── Update order status ─────────────────────────────────────────────────────
  async function updateOrderStatus(orderId: string, newStatus: 'picked_up' | 'delivered') {
    setUpdating(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Gagal')
      if (newStatus === 'delivered') {
        setOrders(prev => prev.filter(o => o.id !== orderId))
        if (expandedId === orderId) setExpandedId(null)
        if (courierId) fetchEarnings(courierId)
      } else {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      }
    } catch {
      setError('Gagal update order. Coba lagi.')
    } finally {
      setUpdating(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LOGIN SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  if (!courierId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-900 p-6">
        <div className="text-center text-white w-full max-w-xs">
          <p className="text-6xl mb-4">🛵</p>
          <h1 className="text-2xl font-bold mb-2">GiriGo Courier</h1>
          <p className="text-white/60 mb-4 text-sm">Masukkan ID Kurir untuk mulai</p>
          <input
            autoFocus
            className="w-full px-5 py-4 rounded-2xl text-gray-900 text-center font-mono text-lg"
            placeholder="Courier ID"
            onBlur={e => {
              const v = e.target.value.trim()
              if (v) { localStorage.setItem('girigoCourierId', v); setCourierId(v); fetchAll(v) }
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const v = e.currentTarget.value.trim()
                if (v) { localStorage.setItem('girigoCourierId', v); setCourierId(v); fetchAll(v) }
              }
            }}
          />
          <p className="text-white/30 text-xs mt-4">ID diberikan oleh admin GiriGo</p>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F0F2F5] max-w-lg mx-auto select-none">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-brand-900 text-white px-5 pt-7 pb-5 safe-top">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              🛵 GiriGo
              <span className="text-[10px] font-normal text-white/40 bg-white/10 px-2 py-0.5 rounded-full">
                Kurir
              </span>
            </h1>
          </div>

          {/* Online/Offline toggle — large touch target */}
          <button
            onClick={toggleOnline}
            disabled={updating}
            className={`min-w-[110px] h-12 px-5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
              status === 'online'
                ? 'bg-green-400 text-green-900 shadow-lg shadow-green-400/30'
                : 'bg-white/15 text-white border border-white/20'
            }`}
          >
            {updating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Power size={16} />
            )}
            {status === 'online' ? 'ONLINE' : 'OFFLINE'}
          </button>
        </div>

        {/* GPS status indicator */}
        {status === 'online' && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${
              gpsStatus === 'active'   ? 'bg-green-400 animate-pulse' :
              gpsStatus === 'acquiring' ? 'bg-yellow-400 animate-pulse' :
              gpsStatus === 'denied'    ? 'bg-red-400' :
              'bg-gray-400'
            }`} />
            <span className="text-white/60">
              {gpsStatus === 'active'    ? `GPS aktif · ${lastGpsTime ? diffMins(lastGpsTime) : 'baru saja'}` :
               gpsStatus === 'acquiring' ? 'Mencari GPS...' :
               gpsStatus === 'denied'    ? 'GPS ditolak — buka izin lokasi' :
               gpsStatus === 'error'     ? 'GPS error — coba lagi' :
               'Menunggu GPS...'}
            </span>
            {gpsStatus === 'denied' && (
              <button onClick={requestGps} className="text-green-300 underline font-semibold">
                Coba lagi
              </button>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: 'Hari Ini', value: formatIDR(earnings.today) },
            { label: 'Total',    value: formatIDR(earnings.total) },
            { label: 'Order',    value: `${earnings.completed} selesai` },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-xl py-3 px-2 text-center">
              <p className="text-white font-bold text-sm leading-tight">{s.value}</p>
              <p className="text-white/50 text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Error banner ────────────────────────────────────────────────────── */}
      {error && (
        <div className="mx-4 mt-3 flex items-center gap-3 px-4 py-3.5 bg-red-50 border border-red-200 rounded-2xl"
             onClick={() => { setError(null); courierId && fetchAll(courierId) }}>
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <span className="text-xs font-bold text-red-600">Tap retry</span>
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="p-4 pb-24 space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center space-y-4 shadow-sm">
            <Loader2 size={36} className="animate-spin text-brand-500 mx-auto" />
            <p className="text-sm text-gray-400">Memuat data...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <p className="text-5xl mb-3">⏳</p>
            <p className="font-bold text-gray-700 text-lg">
              {status === 'online' ? 'Menunggu order...' : 'Anda sedang Offline'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {status === 'online'
                ? 'Order akan muncul otomatis'
                : 'Aktifkan Online untuk menerima order'}
            </p>
            <button
              onClick={() => courierId && fetchAll(courierId)}
              className="mt-4 text-brand-500 font-semibold text-sm flex items-center justify-center gap-1 mx-auto"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        ) : (
          <>
            {/* Active order count */}
            <div className="flex items-center gap-2 px-1">
              <Package size={16} className="text-brand-500" />
              <span className="text-sm font-bold text-gray-600">
                {orders.length} order aktif
              </span>
              <span className="text-xs text-gray-400">
                ({orders.filter(o => o.status === 'picked_up').length} dalam perjalanan)
              </span>
            </div>

            {/* Order cards */}
            {orders.map(order => {
              const isExpanded = expandedId === order.id
              return (
                <div key={order.id}
                     className={`bg-white rounded-2xl shadow-sm border transition-all ${
                       isExpanded ? 'border-brand-300 shadow-md' : 'border-gray-100'
                     }`}>

                  {/* Card header — tap to expand */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="w-full flex items-center gap-3 px-4 py-4 text-left"
                  >
                    {/* Status bar */}
                    <div className={`w-1.5 h-12 rounded-full shrink-0 ${
                      order.status === 'assigned'  ? 'bg-blue-400' :
                      order.status === 'picked_up' ? 'bg-amber-400' : 'bg-gray-300'
                    }`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-brand-600">
                          {order.order_code}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                          order.status === 'assigned'  ? 'bg-blue-50 text-blue-600' :
                          order.status === 'picked_up' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-500'
                        }`}>
                          {order.status === 'assigned' ? 'Pickup' : 'Antar'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {order.pickup_address} → {order.dropoff_address}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatIDR(Math.floor(order.delivery_fee * 0.85))} · {order.distance_km} km
                      </p>
                    </div>

                    <ChevronRight size={18}
                      className={`text-gray-300 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-3 animate-slide-down">
                      {/* Addresses with nav links */}
                      <div className="space-y-2">
                        <div className="flex items-start gap-2.5">
                          <MapPin size={16} className="text-green-500 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Pickup</p>
                            <p className="text-sm font-medium text-gray-800">{order.pickup_address}</p>
                          </div>
                          {order.pickup_lat && order.pickup_lng && (
                            <a href={generateNavLink(order.pickup_lat, order.pickup_lng)}
                               target="_blank" rel="noopener noreferrer"
                               className="p-3 bg-green-50 rounded-xl shrink-0 active:scale-90 transition-transform">
                              <Navigation size={18} className="text-green-600" />
                            </a>
                          )}
                        </div>
                        <div className="w-px h-3 bg-gray-200 ml-[7px]" />
                        <div className="flex items-start gap-2.5">
                          <MapPin size={16} className="text-red-500 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Dropoff</p>
                            <p className="text-sm font-medium text-gray-800">{order.dropoff_address}</p>
                          </div>
                          {order.dropoff_lat && order.dropoff_lng && (
                            <a href={generateNavLink(order.dropoff_lat, order.dropoff_lng)}
                               target="_blank" rel="noopener noreferrer"
                               className="p-3 bg-red-50 rounded-xl shrink-0 active:scale-90 transition-transform">
                              <Navigation size={18} className="text-red-600" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Order details + recipient if in notes */}
                      {order.notes && (
                        <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600">
                          <span className="font-semibold">Catatan:</span> {order.notes}
                        </div>
                      )}

                      {/* Action button */}
                      {order.status === 'assigned' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'picked_up')}
                          disabled={updating}
                          className="w-full h-14 bg-brand-500 hover:bg-brand-600 active:bg-brand-700
                            text-white font-bold text-base rounded-2xl flex items-center justify-center gap-2
                            transition-all active:scale-[0.97] disabled:opacity-50 shadow-lg shadow-brand-500/20"
                        >
                          {updating ? (
                            <Loader2 size={22} className="animate-spin" />
                          ) : (
                            <CheckCircle size={22} />
                          )}
                          Konfirmasi Pickup — Barang Sudah Dijemput
                        </button>
                      )}

                      {order.status === 'picked_up' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          disabled={updating}
                          className="w-full h-14 bg-green-500 hover:bg-green-600 active:bg-green-700
                            text-white font-bold text-base rounded-2xl flex items-center justify-center gap-2
                            transition-all active:scale-[0.97] disabled:opacity-50 shadow-lg shadow-green-500/20"
                        >
                          {updating ? (
                            <Loader2 size={22} className="animate-spin" />
                          ) : (
                            <CheckCircle size={22} />
                          )}
                          Tandai Terkirim — Barang Sudah Sampai
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* ── Bottom refresh bar ────────────────────────────────────────────────── */}
      {orders.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 pt-2 bg-gradient-to-t from-[#F0F2F5] to-transparent z-40">
          <button
            onClick={() => courierId && fetchAll(courierId)}
            disabled={loading}
            className="w-full h-12 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-600
              flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh Orders
          </button>
        </div>
      )}
    </div>
  )
}

function diffMins(d: Date): string {
  const secs = Math.floor((Date.now() - d.getTime()) / 1000)
  if (secs < 5)   return 'baru saja'
  if (secs < 60)  return `${secs}s lalu`
  const mins = Math.floor(secs / 60)
  if (mins < 60)  return `${mins}m lalu`
  return `${Math.floor(mins / 60)}j lalu`
}
