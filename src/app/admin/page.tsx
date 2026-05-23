'use client'
import { useEffect, useState } from 'react'
import { Package, TrendingUp, Users, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { formatIDR } from '@/lib/pricing'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { StatCardSkeleton, Skeleton } from '@/components/ui/Skeleton'
import type { Order } from '@/types'

interface Analytics {
  overview: {
    total_orders:     number
    total_delivered:  number
    gross_revenue:    number
    platform_revenue: number
    success_rate:     number
  }
  daily:     Array<{ date: string; total_orders: number; gross_revenue: number }>
  couriers:  Array<{ name: string; total_orders: number; rating: number; status: string }>
  top_zones: Array<{ zone: string; count: number }>
}

function StatCard({ label, value, sub, icon: Icon, iconBg, delta }: {
  label:   string
  value:   string | number
  sub?:    string
  icon:    React.ElementType
  iconBg:  string
  delta?:  string
}) {
  return (
    <div className="stat-card animate-fade-in">
      <div className={`p-3 rounded-xl shrink-0 ${iconBg}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 tabular-nums mt-0.5 animate-count-up">{value}</p>
        {sub   && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        {delta && <p className="text-xs text-green-600 font-semibold mt-0.5">{delta}</p>}
      </div>
    </div>
  )
}

interface PendingOrder extends Pick<Order, 'id' | 'order_code' | 'pickup_address' | 'dropoff_address' | 'delivery_fee' | 'created_at'> {
  customer?: { name?: string }
}

export default function AdminDashboard() {
  const [data,         setData]         = useState<Analytics | null>(null)
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([])
  const [loading,      setLoading]      = useState(true)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [analyticsRes, ordersRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/orders?status=pending&limit=5'),
      ])
      const analytics = await analyticsRes.json()
      const orders    = await ordersRes.json()
      setData(analytics)
      setPendingOrders(orders.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const ov         = data?.overview
  const onlineCnt  = data?.couriers.filter(c => c.status === 'online').length  ?? 0
  const busyCnt    = data?.couriers.filter(c => c.status === 'busy').length    ?? 0

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">GiriGo Courier · Gerung, Lombok Barat</p>
        </div>
        <button
          onClick={fetchAll}
          className="btn-ghost flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Pending alert panel */}
      {!loading && pendingOrders.length > 0 && (
        <div className="alert-card bg-orange-50 border-orange-400 animate-slide-down">
          <AlertTriangle size={18} className="text-orange-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-800">
              {pendingOrders.length} order menunggu penugasan kurir
            </p>
            <p className="text-xs text-orange-600 mt-0.5">
              {pendingOrders.map(o => o.order_code).join(' · ')}
            </p>
          </div>
          <a href="/admin/orders?status=pending" className="text-xs font-semibold text-orange-700 hover:text-orange-900 whitespace-nowrap">
            Lihat →
          </a>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Total Orders"
              value={ov?.total_orders ?? 0}
              icon={Package}
              iconBg="bg-brand-500"
            />
            <StatCard
              label="Terkirim"
              value={ov?.total_delivered ?? 0}
              sub={`${ov?.success_rate ?? 0}% success rate`}
              icon={CheckCircle}
              iconBg="bg-green-500"
            />
            <StatCard
              label="Gross Revenue"
              value={formatIDR(ov?.gross_revenue ?? 0)}
              sub={`Platform: ${formatIDR(ov?.platform_revenue ?? 0)}`}
              icon={TrendingUp}
              iconBg="bg-purple-500"
            />
            <StatCard
              label="Kurir Aktif"
              value={`${onlineCnt + busyCnt}`}
              sub={`${onlineCnt} online · ${busyCnt} sibuk`}
              icon={Users}
              iconBg="bg-amber-500"
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily orders chart */}
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Order Harian (14 hari terakhir)</h3>
          {loading ? (
            <Skeleton className="h-[220px]" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.daily?.slice(0, 14).reverse() ?? []} barSize={20}>
                <XAxis dataKey="date" tickFormatter={d => d.slice(5)} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
                  formatter={(v: number) => [v, 'Orders']}
                />
                <Bar dataKey="total_orders" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top zones */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Dropoff Zones</h3>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.top_zones ?? []).slice(0, 5).map((z, i) => (
                <div key={z.zone} className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-300 w-4 tabular-nums">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{z.zone}</p>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-1.5">
                      <div
                        className="h-1.5 bg-brand-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (z.count / (data?.top_zones[0]?.count ?? 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-600 tabular-nums">{z.count}</span>
                </div>
              ))}
              {!data?.top_zones?.length && (
                <p className="text-xs text-gray-400 text-center py-4">Belum ada data zona</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Courier availability + Recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Courier availability */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Ketersediaan Kurir</h3>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {(data?.couriers ?? []).map(c => (
                <div key={c.name} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 font-bold text-xs shrink-0">
                    {c.name[0]?.toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-800 truncate">{c.name}</span>
                  <StatusBadge status={c.status as any} size="sm" />
                </div>
              ))}
              {!data?.couriers?.length && (
                <p className="text-xs text-gray-400 text-center py-4">Belum ada kurir</p>
              )}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Order Terbaru</h3>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Order', 'Customer', 'Rute', 'Fee', 'Status'].map(h => (
                      <th key={h} className="text-left pb-2 text-xs font-medium text-gray-400 uppercase tracking-wide pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pendingOrders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 pr-4">
                        <span className="font-mono text-xs font-semibold text-brand-500">{o.order_code}</span>
                      </td>
                      <td className="py-2.5 pr-4 text-gray-700 text-xs">{(o.customer as any)?.name ?? '—'}</td>
                      <td className="py-2.5 pr-4 max-w-[160px]">
                        <p className="text-xs text-gray-500 truncate">{o.pickup_address}</p>
                        <p className="text-xs text-gray-400 truncate">→ {o.dropoff_address}</p>
                      </td>
                      <td className="py-2.5 pr-4 text-xs font-semibold text-gray-700">{formatIDR(o.delivery_fee)}</td>
                      <td className="py-2.5">
                        <StatusBadge status="pending" size="sm" />
                      </td>
                    </tr>
                  ))}
                  {!pendingOrders.length && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-gray-400">
                        Tidak ada order pending
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
