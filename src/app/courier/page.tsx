'use client'
import { useEffect, useState } from 'react'
import { MapPin, Navigation, Camera, CheckCircle, DollarSign, Power } from 'lucide-react'
import { formatIDR } from '@/lib/pricing'
import { generateNavLink } from '@/lib/maps'
import type { Order } from '@/types'

// Courier PWA — mobile-first job management page
// In production: courier_id comes from auth session
// For MVP: stored in localStorage after admin registers courier

export default function CourierPWA() {
  const [courierId, setCourierId] = useState<string | null>(null)
  const [status,    setStatus]    = useState<'online' | 'offline'>('offline')
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const [earnings,  setEarnings]  = useState({ today: 0, week: 0, orders: 0 })
  const [updating,  setUpdating]  = useState(false)

  // Load courier ID from localStorage (set by admin during onboarding)
  useEffect(() => {
    const id = localStorage.getItem('girigoCourierId')
    setCourierId(id)
    if (id) {
      fetchActiveOrder(id)
      fetchEarnings(id)
    }
  }, [])

  async function fetchActiveOrder(id: string) {
    const res  = await fetch(`/api/orders?status=assigned&limit=5`)
    const data = await res.json()
    const mine = (data.data ?? []).find((o: Order) => o.courier_id === id)
    setActiveOrder(mine ?? null)
  }

  async function fetchEarnings(courierId: string) {
    const res  = await fetch(`/api/analytics`)
    const data = await res.json()
    const me   = (data.couriers ?? []).find((c: any) =>
      c.courier_id === courierId || c.name !== undefined
    )
    if (me) {
      setEarnings({ today: me.today_earnings ?? 0, week: me.week_earnings ?? 0, orders: me.total_orders ?? 0 })
    }
  }

  async function toggleOnline() {
    if (!courierId) return
    setUpdating(true)
    const newStatus = status === 'online' ? 'offline' : 'online'

    // Get current GPS location
    let lat: number | undefined, lng: number | undefined
    if (newStatus === 'online' && navigator.geolocation) {
      await new Promise<void>(resolve => {
        navigator.geolocation.getCurrentPosition(
          pos => { lat = pos.coords.latitude; lng = pos.coords.longitude; resolve() },
          () => resolve()
        )
      })
    }

    await fetch('/api/courier/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courier_id: courierId, status: newStatus, lat, lng }),
    })

    setStatus(newStatus)
    setUpdating(false)
  }

  async function updateOrderStatus(orderId: string, newStatus: 'picked_up' | 'delivered') {
    setUpdating(true)
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (newStatus === 'delivered') {
      setActiveOrder(null)
      await toggleOnline()  // go back online
    } else {
      setActiveOrder(prev => prev ? { ...prev, status: newStatus } : null)
    }
    setUpdating(false)
  }

  if (!courierId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-900 p-6">
        <div className="text-center text-white">
          <p className="text-6xl mb-4">🛵</p>
          <h1 className="text-2xl font-bold mb-2">GiriGo Courier</h1>
          <p className="text-white/70">Masukkan Courier ID Anda untuk mulai</p>
          <input
            className="mt-4 w-full px-4 py-3 rounded-xl text-gray-900 text-center font-mono"
            placeholder="Courier ID (UUID)"
            onBlur={e => {
              const v = e.target.value.trim()
              if (v) { localStorage.setItem('girigoCourierId', v); setCourierId(v) }
            }}
          />
        </div>
      </div>
    )
  }

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
            <Power size={14} />
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

      {/* Active Order Card */}
      <div className="p-4">
        {!activeOrder ? (
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
                  {activeOrder.pickup_lat && (
                    <a
                      href={generateNavLink(activeOrder.pickup_lat, activeOrder.pickup_lng!)}
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
                  {activeOrder.dropoff_lat && (
                    <a
                      href={generateNavLink(activeOrder.dropoff_lat, activeOrder.dropoff_lng!)}
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
                <CheckCircle size={18} />
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
                  <CheckCircle size={18} />
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
