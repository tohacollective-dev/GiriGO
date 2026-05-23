'use client'
import { useEffect, useState } from 'react'
import { RefreshCw, Star, Truck, Wifi, WifiOff, Activity } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { CourierCardSkeleton } from '@/components/ui/Skeleton'
import type { Courier } from '@/types'

interface CourierRow extends Omit<Courier, 'user'> {
  user:           { name: string; phone: string }
  vehicle_plate?: string
  zone?:          string
}

const STATUS_TABS = [
  { label: 'Semua',   value: '' },
  { label: 'Online',  value: 'online'  },
  { label: 'Sibuk',   value: 'busy'    },
  { label: 'Offline', value: 'offline' },
]

function StarRating({ rating }: { rating: number }) {
  const filled = Math.round(rating)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={12}
          className={i <= filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
      <span className="text-xs font-semibold text-gray-700 ml-1 tabular-nums">
        {rating > 0 ? rating.toFixed(1) : '—'}
      </span>
    </div>
  )
}

function GpsRecency({ timestamp }: { timestamp: string | null }) {
  if (!timestamp) return <span className="text-xs text-gray-300">—</span>

  const ageMs  = Date.now() - new Date(timestamp).getTime()
  const ageMins = ageMs / 60000
  const color   = ageMins < 5 ? 'text-green-500' : ageMins < 30 ? 'text-amber-500' : 'text-gray-400'

  return (
    <span className={`text-xs font-medium ${color}`}>
      {formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: idLocale })}
    </span>
  )
}

export default function CouriersPage() {
  const [couriers, setCouriers] = useState<CourierRow[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('')

  const fetchCouriers = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/couriers')
      const data = await res.json()
      setCouriers(data.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCouriers() }, [])

  const byStatus = (s: string) => couriers.filter(c => c.status === s)
  const displayed = tab ? couriers.filter(c => c.status === tab) : couriers

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Couriers</h2>
          <p className="text-xs text-gray-400 mt-0.5">{couriers.length} kurir terdaftar</p>
        </div>
        <button onClick={fetchCouriers} className="btn-ghost flex items-center gap-2" disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-3 gap-3 max-w-sm">
        {[
          { icon: Wifi,     label: 'Online',  count: byStatus('online').length,  bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
          { icon: Activity, label: 'Sibuk',   count: byStatus('busy').length,    bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500' },
          { icon: WifiOff,  label: 'Offline', count: byStatus('offline').length, bg: 'bg-gray-50',   text: 'text-gray-500',   dot: 'bg-gray-400'  },
        ].map(s => (
          <div key={s.label} className={`rounded-xl px-4 py-3 ${s.bg} flex items-center gap-2`}>
            <span className={`w-2 h-2 rounded-full ${s.dot} shrink-0`} />
            <span className={`text-sm font-semibold ${s.text}`}>{s.label}</span>
            <span className={`text-sm font-bold ${s.text} ml-auto tabular-nums`}>{s.count}</span>
          </div>
        ))}
      </div>

      {/* Tab filter */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {STATUS_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
              tab === t.value
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.value && (
              <span className="ml-1.5 text-xs text-gray-400 tabular-nums">
                ({byStatus(t.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Couriers table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Kurir', 'WhatsApp', 'Kendaraan', 'Status', 'Zone', 'GPS Terakhir', 'Orders', 'Rating', 'Penghasilan'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={9} className="px-4 py-3">
                    <CourierCardSkeleton />
                  </td>
                </tr>
              ))}
              {!loading && !displayed.length && (
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      icon={Truck}
                      title="Belum ada kurir"
                      message="Kurir yang terdaftar akan muncul di sini."
                    />
                  </td>
                </tr>
              )}
              {!loading && displayed.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 font-bold text-sm shrink-0">
                        {c.user.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{c.user.name}</p>
                        {c.is_verified && (
                          <p className="text-[10px] text-green-600 font-medium">✓ Verified</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.user.phone}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 capitalize">
                    {c.vehicle_type}
                    {c.vehicle_plate && <span className="text-gray-400"> · {c.vehicle_plate}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status as any} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{c.zone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <GpsRecency timestamp={c.location_updated} />
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-700 tabular-nums">{c.total_orders}</td>
                  <td className="px-4 py-3">
                    <StarRating rating={c.rating} />
                  </td>
                  <td className="px-4 py-3 font-medium text-green-700 tabular-nums text-xs">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(c.total_earnings)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
