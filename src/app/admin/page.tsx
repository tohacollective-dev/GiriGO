'use client'
import { useEffect, useState } from 'react'
import { Package, TrendingUp, Users, CheckCircle, AlertTriangle, RefreshCw, Clock } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts'
import { formatIDR } from '@/lib/pricing'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { StatCardSkeleton, Skeleton } from '@/components/ui/Skeleton'
import { ActivateSignCard } from '@/components/admin/ActivateSignCard'
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

interface PendingOrder extends Pick<Order, 'id' | 'order_code' | 'pickup_address' | 'dropoff_address' | 'delivery_fee' | 'created_at'> {
  customer?: { name?: string }
}

// ── KPI Card with mini sparkline ──────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, iconBg, trend, sparkData }: {
  label:      string
  value:      string | number
  sub?:       string
  icon:       React.ElementType
  iconBg:     string
  trend?:     number
  sparkData?: number[]
}) {
  const trendPositive = (trend ?? 0) >= 0
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5 flex flex-col gap-3 animate-fade-in min-h-[120px]">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl shrink-0 ${iconBg}`}>
          <Icon size={18} className="text-white" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trendPositive ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'
          }`}>
            {trendPositive ? '↑' : '↓'}{Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-[28px] font-bold text-brand-900 tabular-nums leading-tight mt-0.5 animate-count-up">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {sparkData && sparkData.length > 1 && (
        <div className="h-8 -mx-1">
          <ResponsiveContainer width="100%" height={32}>
            <LineChart data={sparkData.map((v, i) => ({ v, i }))}>
              <Line type="monotone" dataKey="v" stroke="#2563EB" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ── Courier status donut ──────────────────────────────────────────────────────
const DONUT_COLORS = ['#22C55E', '#F97316', '#94A3B8']

function CourierDonut({ online, busy, offline }: { online: number; busy: number; offline: number }) {
  const total = online + busy + offline
  const data = [
    { name: 'Online',  value: online  },
    { name: 'Busy',    value: busy    },
    { name: 'Offline', value: offline },
  ]
  return (
    <div className="flex items-center gap-4">
      <PieChart width={72} height={72}>
        <Pie data={data} cx={32} cy={32} innerRadius={22} outerRadius={34}
          dataKey="value" stroke="none">
          {data.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
        </Pie>
      </PieChart>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-gray-600">Online</span>
          <span className="font-bold text-gray-900 ml-1 tabular-nums">{online}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-400" />
          <span className="text-gray-600">Busy</span>
          <span className="font-bold text-gray-900 ml-1 tabular-nums">{busy}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-300" />
          <span className="text-gray-600">Offline</span>
          <span className="font-bold text-gray-900 ml-1 tabular-nums">{offline}</span>
        </div>
        <p className="text-gray-400 pt-0.5">{total} total</p>
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [data,          setData]          = useState<Analytics | null>(null)
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([])
  const [loading,       setLoading]       = useState(true)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [analyticsRes, ordersRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/orders?status=pending&limit=5'),
      ])
      const [analytics, orders] = await Promise.all([analyticsRes.json(), ordersRes.json()])
      setData(analytics)
      setPendingOrders(orders.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const ov        = data?.overview
  const onlineCnt = data?.couriers.filter(c => c.status === 'online').length  ?? 0
  const busyCnt   = data?.couriers.filter(c => c.status === 'busy').length    ?? 0
  const offlineCnt= data?.couriers.filter(c => c.status === 'offline').length ?? 0

  // Sparkline data: last 7 days order counts
  const last7     = (data?.daily ?? []).slice(0, 7).reverse()
  const sparkOrders  = last7.map(d => d.total_orders)
  const sparkRevenue = last7.map(d => d.gross_revenue)

  // 7-day bar chart data (today highlighted)
  const barData = (data?.daily ?? []).slice(0, 7).reverse().map((d, i, arr) => ({
    date:    d.date.slice(5),
    orders:  d.total_orders,
    revenue: d.gross_revenue,
    isToday: i === arr.length - 1,
  }))

  return (
    <div className="p-6 space-y-6 max-w-[1440px]">

      {/* Pending alert banner — persistent amber when orders unassigned */}
      {!loading && pendingOrders.length > 0 && (
        <div className="flex items-center gap-3 px-5 py-3 bg-amber-50 border border-amber-200 rounded-xl animate-slide-down">
          <AlertTriangle size={18} className="text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {pendingOrders.length} order menunggu penugasan kurir
            </p>
            <p className="text-xs text-amber-600 mt-0.5 font-mono">
              {pendingOrders.map(o => o.order_code).join(' · ')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/admin/orders?status=pending"
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors">
              Lihat Orders →
            </a>
            <button onClick={fetchAll} className="text-amber-400 hover:text-amber-600 transition-colors" disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      )}

      {/* KPI cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              label="Total Orders"
              value={ov?.total_orders ?? 0}
              icon={Package}
              iconBg="bg-brand-500"
              trend={12}
              sparkData={sparkOrders}
            />
            <KpiCard
              label="Active Couriers"
              value={`${onlineCnt + busyCnt} / ${onlineCnt + busyCnt + offlineCnt}`}
              sub={`${onlineCnt} online · ${busyCnt} busy`}
              icon={Users}
              iconBg="bg-amber-500"
            />
            <KpiCard
              label="Revenue Hari Ini"
              value={formatIDR(ov?.gross_revenue ?? 0)}
              sub={`Platform: ${formatIDR(ov?.platform_revenue ?? 0)}`}
              icon={TrendingUp}
              iconBg="bg-purple-500"
              trend={8}
              sparkData={sparkRevenue}
            />
            <KpiCard
              label="Avg Delivery Time"
              value="28 min"
              sub="Target: < 35 min"
              icon={Clock}
              iconBg="bg-green-500"
              trend={-3}
            />
          </>
        )}
      </div>

      {/* Activate Sign control */}
      <ActivateSignCard />

      {/* Main content: recent orders + courier status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Orders table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="text-sm font-semibold text-gray-700">Order Terbaru</h3>
            <a href="/admin/orders" className="text-xs font-semibold text-brand-500 hover:text-brand-600">
              Lihat Semua →
            </a>
          </div>
          {loading ? (
            <div className="px-5 pb-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-brand-900">
                  <tr>
                    {['Order', 'Customer', 'Rute', 'Fee', 'Status'].map(h => (
                      <th key={h} className="text-left px-5 py-2.5 text-[11px] font-semibold text-white/70 uppercase tracking-widest whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pendingOrders.map((o, i) => (
                    <tr key={o.id} className={`hover:bg-blue-50/50 transition-colors ${i % 2 === 1 ? 'bg-[#F5F7FA]' : ''}`}>
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs font-semibold text-brand-500">{o.order_code}</span>
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-800 text-xs">
                        {(o.customer as any)?.name ?? '—'}
                      </td>
                      <td className="px-5 py-3 max-w-[160px]">
                        <p className="text-xs text-gray-500 truncate">{o.pickup_address}</p>
                        <p className="text-xs text-gray-400 truncate">→ {o.dropoff_address}</p>
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-gray-700 tabular-nums">
                        {formatIDR(o.delivery_fee)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status="pending" size="sm" />
                      </td>
                    </tr>
                  ))}
                  {!pendingOrders.length && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-gray-400">
                        ✅ Tidak ada order pending
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Courier Status panel */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Courier Status</h3>
            <a href="/admin/couriers" className="text-xs font-semibold text-brand-500 hover:text-brand-600">
              Manage →
            </a>
          </div>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16" />
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : (
            <>
              <CourierDonut online={onlineCnt} busy={busyCnt} offline={offlineCnt} />
              <div className="mt-4 space-y-1.5">
                {(data?.couriers ?? []).slice(0, 5).map(c => (
                  <div key={c.name} className="flex items-center gap-2.5 py-1.5 border-b border-gray-50 last:border-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      c.status === 'online' ? 'bg-green-500' :
                      c.status === 'busy'   ? 'bg-orange-400' : 'bg-gray-300'
                    }`} />
                    <span className="flex-1 text-xs font-medium text-gray-800 truncate">{c.name}</span>
                    <StatusBadge status={c.status as any} size="sm" />
                    <span className="text-[10px] text-gray-400 tabular-nums">★{c.rating.toFixed(1)}</span>
                  </div>
                ))}
                {!data?.couriers?.length && (
                  <p className="text-xs text-gray-400 text-center py-4">Belum ada kurir</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Revenue chart + Zone heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue 7-day bar chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Revenue (7 hari terakhir)</h3>
            <a href="/admin/analytics" className="text-xs font-semibold text-brand-500 hover:text-brand-600">
              Analytics →
            </a>
          </div>
          {loading ? (
            <Skeleton className="h-[180px]" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} barSize={22}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
                  formatter={(v: number, name: string) => [
                    name === 'orders' ? v : formatIDR(v),
                    name === 'orders' ? 'Orders' : 'Revenue'
                  ]}
                />
                <Bar dataKey="orders" name="orders" fill="#2563EB" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top zones */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Dropoff Zones</h3>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.top_zones ?? []).slice(0, 6).map((z, i) => (
                <div key={z.zone} className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-300 w-4 tabular-nums">#{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{z.zone}</p>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-1">
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
    </div>
  )
}
