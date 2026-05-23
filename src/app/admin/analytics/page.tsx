'use client'
import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import { formatIDR } from '@/lib/pricing'

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

export default function AnalyticsPage() {
  const [data,    setData]    = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
      </div>
    )
  }

  const daily30 = (data?.daily ?? []).slice(0, 30).reverse()

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Analytics</h2>

      {/* Revenue split cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Gross Revenue</p>
          <p className="text-2xl font-bold text-gray-900">{formatIDR(data?.overview.gross_revenue ?? 0)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Platform Revenue (15%)</p>
          <p className="text-2xl font-bold text-purple-600">{formatIDR(data?.overview.platform_revenue ?? 0)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Courier Payout (85%)</p>
          <p className="text-2xl font-bold text-green-600">
            {formatIDR((data?.overview.gross_revenue ?? 0) - (data?.overview.platform_revenue ?? 0))}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Success Rate</p>
          <p className="text-2xl font-bold text-amber-600">{data?.overview.success_rate ?? 0}%</p>
        </div>
      </div>

      {/* Daily orders + revenue */}
      <div className="card">
        <h3 className="text-base font-semibold mb-4">Order Volume & Revenue — 30 Hari Terakhir</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={daily30}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tickFormatter={d => d.slice(5)} tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left"  tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }}
              tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value: number, name: string) =>
                name === 'gross_revenue' ? [formatIDR(value), 'Revenue'] : [value, 'Orders']
              }
            />
            <Legend />
            <Bar yAxisId="left"  dataKey="total_orders" name="Orders"  fill="#0077B6" radius={[4,4,0,0]} />
            <Bar yAxisId="right" dataKey="gross_revenue" name="Revenue" fill="#7c3aed" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Zone breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-base font-semibold mb-4">Top Dropoff Zones</h3>
          <div className="space-y-3">
            {(data?.top_zones ?? []).map((z, i) => (
              <div key={z.zone} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-5">#{i+1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium truncate">{z.zone}</p>
                  <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                    <div
                      className="h-1.5 bg-brand-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (z.count / (data?.top_zones[0]?.count ?? 1)) * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-700 w-8 text-right">{z.count}</span>
              </div>
            ))}
            {!data?.top_zones?.length && (
              <p className="text-gray-400 text-sm text-center py-6">Belum ada data zone</p>
            )}
          </div>
        </div>

        {/* Courier performance */}
        <div className="card">
          <h3 className="text-base font-semibold mb-4">Courier Performance</h3>
          <div className="space-y-3">
            {(data?.couriers ?? []).map(c => (
              <div key={c.name} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-xs shrink-0">
                  {c.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`badge badge-${c.status} text-xs`}>{c.status}</span>
                    <span className="text-xs text-yellow-500">⭐ {c.rating > 0 ? c.rating : 'N/A'}</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-700 shrink-0">{c.total_orders} orders</span>
              </div>
            ))}
            {!data?.couriers?.length && (
              <p className="text-gray-400 text-sm text-center py-6">Belum ada data kurir</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
