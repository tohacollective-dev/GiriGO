'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { RefreshCw, Star, Truck, Wifi, WifiOff, Activity, UserPlus, Download, MoreHorizontal, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { CourierCardSkeleton } from '@/components/ui/Skeleton'
import type { Courier } from '@/types'

// ── Types ────────────────────────────────────────────────────────────────────

interface CourierRow extends Omit<Courier, 'user'> {
  user:           { name: string; phone: string }
  vehicle_plate?: string
  zone?:          string
}

// ── Avatar color hash ─────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500',
  'bg-amber-500', 'bg-rose-500',  'bg-cyan-500',
]
const avatarColor = (name: string) =>
  AVATAR_COLORS[name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length]

// ── Tab config ───────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { label: 'Semua',   value: '',        icon: null              },
  { label: 'Online',  value: 'online',  icon: null              },
  { label: 'Sibuk',   value: 'busy',    icon: null              },
  { label: 'Offline', value: 'offline', icon: null              },
  { label: 'Verif',   value: 'unverified', icon: <AlertTriangle size={12} className="text-amber-500" /> },
]

// ── Sub-components ────────────────────────────────────────────────────────────

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

  const ageMs   = Date.now() - new Date(timestamp).getTime()
  const ageMins = ageMs / 60000

  let dotColor: string
  let textColor: string
  let dotChar: string

  if (ageMins < 5) {
    dotColor  = 'text-green-500'
    textColor = 'text-green-600'
    dotChar   = '●'
  } else if (ageMins < 30) {
    dotColor  = 'text-amber-500'
    textColor = 'text-amber-600'
    dotChar   = '●'
  } else {
    dotColor  = 'text-gray-400'
    textColor = 'text-gray-400'
    dotChar   = '○'
  }

  return (
    <span className={`text-xs font-medium ${textColor} flex items-center gap-1`}>
      <span className={`${dotColor} text-[10px] leading-none`}>{dotChar}</span>
      {formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: idLocale })}
    </span>
  )
}

// ── Row action menu ──────────────────────────────────────────────────────────

function ActionMenu({
  courier,
  isOpen,
  onOpen,
  onClose,
  onToggleStatus,
}: {
  courier:         CourierRow
  isOpen:          boolean
  onOpen:          () => void
  onClose:         () => void
  onToggleStatus:  (id: string, newStatus: string) => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onClose])

  const phone           = courier.user.phone.replace(/^0/, '').replace(/\D/g, '')
  const isOnline        = courier.status === 'online'
  const nextStatusLabel = isOnline ? 'Set Offline' : 'Set Online'
  const nextStatus      = isOnline ? 'offline' : 'online'

  return (
    <div className="flex items-center gap-1">
      {/* WA quick-link */}
      <a
        href={`https://wa.me/62${phone}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-ghost text-green-600 text-xs px-2 py-1 rounded-md border border-green-200 hover:bg-green-50 font-semibold"
        title="WhatsApp"
      >
        WA
      </a>

      {/* More menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={isOpen ? onClose : onOpen}
          className="btn-ghost p-1.5 text-gray-400 hover:text-gray-600 rounded-md"
          title="More actions"
        >
          <MoreHorizontal size={15} />
        </button>
        {isOpen && (
          <div className="absolute right-0 top-8 z-50 w-40 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-slide-down">
            <button
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => {
                window.open(`https://wa.me/62${phone}`, '_blank')
                onClose()
              }}
            >
              WhatsApp
            </button>
            <button
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => {
                onToggleStatus(courier.id, nextStatus)
                onClose()
              }}
            >
              {nextStatusLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── CSV Export ───────────────────────────────────────────────────────────────

function exportCouriersCSV(couriers: CourierRow[]) {
  const header = 'Nama,Phone,Kendaraan,Plat,Status,Zone,Total Orders,Rating,Penghasilan (IDR),Verified'
  const lines = couriers.map(c =>
    [
      c.user.name,
      c.user.phone,
      c.vehicle_type,
      c.vehicle_plate ?? '',
      c.status,
      c.zone ?? '',
      c.total_orders,
      c.rating,
      c.total_earnings,
      c.is_verified ? 'Ya' : 'Tidak',
    ].join(',')
  )
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `girigocourier-kurir-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function CouriersPage() {
  const [couriers,   setCouriers]   = useState<CourierRow[]>([])
  const [loading,    setLoading]    = useState(true)
  const [tab,        setTab]        = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const fetchCouriers = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/couriers')
      const data = await res.json()
      setCouriers(data.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCouriers() }, [fetchCouriers])

  const handleToggleStatus = async (courierId: string, newStatus: string) => {
    try {
      await fetch('/api/courier/status', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ courier_id: courierId, status: newStatus }),
      })
      fetchCouriers()
    } catch { /* keep stale data on error */ }
  }

  const handleInviteCourier = () => {
    const adminPhone = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP
    const inviteMsg  = encodeURIComponent(
      'Halo! Kami dari GiriGo Courier ingin mengundang Anda bergabung sebagai kurir. ' +
      'Silakan balas pesan ini untuk informasi lebih lanjut. 🛵'
    )
    window.open(`https://wa.me/${adminPhone || '6281234567890'}?text=${inviteMsg}`, '_blank')
  }

  const byStatus      = (s: string) => couriers.filter(c => c.status === s)
  const unverified    = couriers.filter(c => !c.is_verified)

  const displayed = tab === 'unverified'
    ? unverified
    : tab
      ? couriers.filter(c => c.status === tab)
      : couriers

  const onlineCount  = byStatus('online').length
  const busyCount    = byStatus('busy').length
  const offlineCount = byStatus('offline').length

  // Table column count including new Aksi column
  const COL_COUNT = 10

  return (
    <div className="p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Couriers</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {couriers.length} kurir terdaftar
            {' · '}<span className="text-green-600 font-medium">{onlineCount} online</span>
            {' · '}<span className="text-amber-600 font-medium">{busyCount} busy</span>
            {' · '}<span className="text-gray-500">{offlineCount} offline</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => exportCouriersCSV(couriers)}
            disabled={loading || couriers.length === 0}
            className="btn-ghost flex items-center gap-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40"
          >
            <Download size={14} /> Export
          </button>
          <button
            onClick={handleInviteCourier}
            className="btn-primary flex items-center gap-1.5 text-xs"
          >
            <UserPlus size={14} /> Undang Kurir
          </button>
          <button onClick={fetchCouriers} className="btn-ghost flex items-center gap-2" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Status summary cards ── */}
      <div className="grid grid-cols-3 gap-3 max-w-sm">
        {[
          { icon: Wifi,     label: 'Online',  count: onlineCount,  bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
          { icon: Activity, label: 'Sibuk',   count: busyCount,    bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500' },
          { icon: WifiOff,  label: 'Offline', count: offlineCount, bg: 'bg-gray-50',   text: 'text-gray-500',   dot: 'bg-gray-400'  },
        ].map(s => (
          <div key={s.label} className={`rounded-xl px-4 py-3 ${s.bg} flex items-center gap-2`}>
            <span className={`w-2 h-2 rounded-full ${s.dot} shrink-0`} />
            <span className={`text-sm font-semibold ${s.text}`}>{s.label}</span>
            <span className={`text-sm font-bold ${s.text} ml-auto tabular-nums`}>{s.count}</span>
          </div>
        ))}
      </div>

      {/* ── Tab filter ── */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {STATUS_TABS.map(t => {
          const count = t.value === 'unverified'
            ? unverified.length
            : t.value
              ? byStatus(t.value).length
              : undefined

          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap flex items-center gap-1.5 ${
                tab === t.value
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.icon}
              {t.label}
              {count !== undefined && (
                <span className="ml-0.5 text-xs text-gray-400 tabular-nums">
                  ({count})
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Couriers table ── */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Kurir', 'WhatsApp', 'Kendaraan', 'Status', 'Zone', 'GPS Terakhir', 'Orders', 'Rating', 'Penghasilan', 'Aksi'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={COL_COUNT} className="px-4 py-3">
                    <CourierCardSkeleton />
                  </td>
                </tr>
              ))}
              {!loading && !displayed.length && (
                <tr>
                  <td colSpan={COL_COUNT}>
                    <EmptyState
                      icon={Truck}
                      title="Belum ada kurir"
                      message="Kurir yang terdaftar akan muncul di sini."
                    />
                  </td>
                </tr>
              )}
              {!loading && displayed.map(c => {
                const initials   = c.user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                const bg         = avatarColor(c.user.name)
                const isMenuOpen = openMenuId === c.id

                return (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Kurir */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 ${bg} rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{c.user.name}</p>
                          {c.is_verified
                            ? <p className="text-[10px] text-green-600 font-medium">✓ Verified</p>
                            : <p className="text-[10px] text-amber-500 font-medium">⚠ Belum diverifikasi</p>
                          }
                        </div>
                      </div>
                    </td>

                    {/* WhatsApp */}
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.user.phone}</td>

                    {/* Kendaraan */}
                    <td className="px-4 py-3 text-xs text-gray-600 capitalize">
                      {c.vehicle_type}
                      {c.vehicle_plate && <span className="text-gray-400"> · {c.vehicle_plate}</span>}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status as any} size="sm" />
                    </td>

                    {/* Zone */}
                    <td className="px-4 py-3 text-xs text-gray-500">{c.zone ?? '—'}</td>

                    {/* GPS Terakhir */}
                    <td className="px-4 py-3">
                      <GpsRecency timestamp={c.location_updated} />
                    </td>

                    {/* Orders */}
                    <td className="px-4 py-3 font-semibold text-gray-700 tabular-nums">{c.total_orders}</td>

                    {/* Rating */}
                    <td className="px-4 py-3">
                      <StarRating rating={c.rating} />
                    </td>

                    {/* Penghasilan */}
                    <td className="px-4 py-3 font-medium text-green-700 tabular-nums text-xs">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
                      }).format(c.total_earnings)}
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-3">
                      <ActionMenu
                        courier={c}
                        isOpen={isMenuOpen}
                        onOpen={() => setOpenMenuId(c.id)}
                        onClose={() => setOpenMenuId(null)}
                        onToggleStatus={handleToggleStatus}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
