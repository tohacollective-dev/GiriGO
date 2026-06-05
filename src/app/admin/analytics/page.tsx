'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import { format, parseISO, subDays } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Download, TrendingUp, TrendingDown, Minus, AlertTriangle, RefreshCw } from 'lucide-react'
import { formatIDR } from '@/lib/pricing'
import { Skeleton } from '@/components/ui/Skeleton'

// ── Types ────────────────────────────────────────────────────────────────────

interface Analytics {
  overview: {
    total_orders:     number
    total_delivered:  number
    gross_revenue:    number
    platform_revenue: number
    success_rate:     number
  }
  daily:     Array<{ date: string; total_orders: number; gross_revenue: number; cod_value?: number }>
  couriers:  Array<{ name: string; total_orders: number; rating: number; status: string }>
  top_zones: Array<{ zone: string; count: number }>
}

type Period = 7 | 30 | 90

// ── Avatar color hash ────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500',
  'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
]
function avatarColor(name: string): string {
  const sum = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM dd', { locale: idLocale })
  } catch {
    return dateStr.slice(5)
  }
}

function filterByPeriod<T extends { date: string }>(rows: T[], period: Period): T[] {
  const cutoff = subDays(new Date(), period)
  return rows.filter(r => {
    try { return parseISO(r.date) >= cutoff } catch { return true }
  })
}

// ── Trend badge ──────────────────────────────────────────────────────────────

function TrendBadge({ current, prev, unit = '' }: { current: number; prev: number; unit?: string }) {
  if (prev === 0) return null
  const pct = Math.round(((current - prev) / prev) * 100)
  if (pct === 0) return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-gray-400">
      <Minus size={10} /> stabil
    </span>
  )
  const up = pct > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {up ? '+' : ''}{pct}%{unit}
    </span>
  )
}

// ── KPI Card skeleton ─────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="card space-y-2 min-h-[100px]">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-3 w-16" />
    </div>
  )
}

// ── Custom Donut label ───────────────────────────────────────────────────────

const DONUT_COLORS: Record<string, string> = { delivered: '#22C55E', remaining: '#94A3B8' }
const DONUT_LABELS:  Record<string, string> = { delivered: 'Terkirim', remaining: 'Lainnya' }

function renderCustomLabel({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: {
  cx: number; cy: number; midAngle: number
  innerRadius: number; outerRadius: number; percent: number
}) {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  if (percent < 0.05) return null
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// ── CSV Export ───────────────────────────────────────────────────────────────

function exportCSV(rows: Analytics['daily'], period: Period) {
  const filtered = filterByPeriod(rows, period)
  const header = 'Date,Total Orders,Gross Revenue (IDR),COD Value (IDR)'
  const lines = filtered.map(r =>
    `${r.date},${r.total_orders},${r.gross_revenue},${r.cod_value ?? 0}`
  )
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `girigocourier-analytics-${period}d-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data,    setData]    = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [period,  setPeriod]  = useState<Period>(7)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    fetch('/api/analytics')
      .then(r => {
        if (!r.ok) throw new Error(r.status === 401 ? 'Unauthorized' : 'Gagal mengambil data')
        return r.json()
      })
      .then(d => { setData(d); setLoading(false) })
      .catch((err) => { setError(err.message ?? 'Gagal menghubungi server'); setLoading(false) })
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Derive filtered daily data
  const allDaily = (data?.daily ?? []).slice().reverse()
  const daily    = filterByPeriod(allDaily, period)

  // Half-period comparison for trends
  const half     = Math.floor(daily.length / 2)
  const prevHalf = daily.slice(0, half)
  const currHalf = daily.slice(half)
  const prevOrders  = prevHalf.reduce((s, r) => s + r.total_orders, 0)
  const currOrders  = currHalf.reduce((s, r) => s + r.total_orders, 0)
  const prevRevenue = prevHalf.reduce((s, r) => s + r.gross_revenue, 0)
  const currRevenue = currHalf.reduce((s, r) => s + r.gross_revenue, 0)

  // KPI values
  const totalOrders    = data?.overview.total_orders     ?? 0
  const grossRevenue   = data?.overview.gross_revenue    ?? 0
  const completionRate = data?.overview.success_rate     ?? 0

  // Top couriers sorted by orders
  const topCouriers = [...(data?.couriers ?? [])].sort((a, b) => b.total_orders - a.total_orders).slice(0, 5)

  // Status donut chart — uses real delivered vs remaining counts
  const delivered  = data?.overview.total_delivered ?? 0
  const totalOrd   = data?.overview.total_orders    ?? 0
  const remaining  = Math.max(0, totalOrd - delivered)
  const donutData  = [
    { name: 'delivered', value: delivered, label: 'Terkirim' },
    ...(remaining > 0 ? [{ name: 'remaining', value: remaining, label: 'Lainnya' }] : []),
  ].filter(d => d.value > 0)

  // Top zones capped at 6
  const zones = (data?.top_zones ?? []).slice(0, 6)
  const maxZone = zones[0]?.count ?? 1

  const PERIODS: { label: string; value: Period }[] = [
    { label: '7D',  value: 7  },
    { label: '30D', value: 30 },
    { label: '90D', value: 90 },
  ]

  return (
    <div className="p-6 space-y-6">

      {/* ── Top bar: title + date range + export ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
          <p className="text-xs text-gray-400 mt-0.5">Statistik operasional GiriGo</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period tabs */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-100 ${
                  period === p.value
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Export CSV */}
          <button
            onClick={() => data && exportCSV(data.daily, period)}
            disabled={!data}
            className="btn-ghost flex items-center gap-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40"
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700 flex-1">Gagal memuat data analitik. Pastikan Anda sudah login.</p>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-800 px-3 py-1.5 rounded-lg hover:bg-red-100"
          >
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      )}

      {/* ── KPI row ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <KpiSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Orders */}
          <div className="card space-y-1.5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900 tabular-nums">{totalOrders.toLocaleString('id-ID')}</p>
            <TrendBadge current={currOrders} prev={prevOrders} />
          </div>

          {/* Gross Revenue */}
          <div className="card space-y-1.5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gross Revenue</p>
            <p className="text-3xl font-bold text-brand-600 tabular-nums">{formatIDR(grossRevenue)}</p>
            <TrendBadge current={currRevenue} prev={prevRevenue} />
          </div>

          {/* Completion Rate */}
          <div className="card space-y-1.5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Completion Rate</p>
            <p className="text-3xl font-bold text-green-600 tabular-nums">{completionRate}%</p>
            <span className="text-[11px] text-gray-400">{data?.overview.total_delivered ?? 0} terkirim</span>
          </div>

          {/* Avg Delivery Time (estimated) */}
          <div className="card space-y-1.5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Delivery</p>
            <p className="text-3xl font-bold text-amber-600 tabular-nums">~45<span className="text-base font-medium ml-0.5">min</span></p>
            <span className="text-[11px] text-gray-400">estimasi zona Gerung</span>
          </div>
        </div>
      )}

      {/* ── Revenue Area Chart (2/3) + Top Couriers (1/3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Area chart — 2/3 */}
        <div className="card lg:col-span-2">
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            Revenue &amp; Volume — {period} Hari Terakhir
          </h3>
          {loading ? (
            <Skeleton className="w-full h-64 rounded-lg" />
          ) : daily.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-300 text-sm">Belum ada data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={daily} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradFee" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="gradCod" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#FACC15" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#FACC15" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDate}
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                  width={38}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(value: number, name: string) => [
                    formatIDR(value),
                    name === 'gross_revenue' ? 'Ongkir' : 'COD',
                  ]}
                  labelFormatter={fmtDate}
                />
                <Legend
                  formatter={v => <span className="text-xs text-gray-600">{v === 'gross_revenue' ? 'Ongkir' : 'COD Value'}</span>}
                />
                <Area
                  type="monotone"
                  dataKey="gross_revenue"
                  name="gross_revenue"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fill="url(#gradFee)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#2563EB' }}
                  stackId="rev"
                />
                <Area
                  type="monotone"
                  dataKey="cod_value"
                  name="cod_value"
                  stroke="#FACC15"
                  strokeWidth={2}
                  fill="url(#gradCod)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#FACC15' }}
                  stackId="rev"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top 5 Couriers leaderboard — 1/3 */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Top 5 Kurir</h3>
          {loading ? (
            <div className="space-y-3">
              {[0,1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : topCouriers.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">Belum ada data kurir</p>
          ) : (
            <div className="space-y-3">
              {topCouriers.map((c, i) => {
                const initials = c.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                const bg = avatarColor(c.name)
                return (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-4 shrink-0">#{i + 1}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${bg}`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-yellow-500">⭐</span>
                        <span className="text-[10px] text-gray-500">
                          {c.rating > 0 ? c.rating.toFixed(1) : '—'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-700 tabular-nums shrink-0">
                      {c.total_orders}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Donut (1/3) + Zone bars (2/3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Donut chart — 1/3 */}
        <div className="card flex flex-col items-center">
          <h3 className="text-base font-semibold text-gray-800 mb-4 self-start">Orders by Status</h3>
          {loading ? (
            <Skeleton className="w-48 h-48 rounded-full" />
          ) : totalOrd === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-300 text-sm">Belum ada data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomLabel}
                  >
                    {donutData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={DONUT_COLORS[entry.name as keyof typeof DONUT_COLORS] ?? '#CBD5E1'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    formatter={(value: number, name: string) => [value, DONUT_LABELS[name] ?? name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
                {donutData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: DONUT_COLORS[d.name as keyof typeof DONUT_COLORS] }}
                    />
                    <span className="text-[11px] text-gray-600">{DONUT_LABELS[d.name]}</span>
                    <span className="text-[11px] font-semibold text-gray-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Horizontal Zone bar chart — 2/3 */}
        <div className="card lg:col-span-2">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Top Dropoff Zones</h3>
          {loading ? (
            <div className="space-y-3">
              {[80, 70, 60, 55, 45, 35].map((w, i) => (
                <div key={i} style={{ width: `${w}%` }}>
                  <Skeleton className="h-8 rounded w-full" />
                </div>
              ))}
            </div>
          ) : zones.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">Belum ada data zone</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={zones}
                layout="vertical"
                margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="zone"
                  tick={{ fontSize: 11, fill: '#374151' }}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(v: number) => [v, 'Orders']}
                />
                <Bar
                  dataKey="count"
                  name="Orders"
                  fill="#2563EB"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
