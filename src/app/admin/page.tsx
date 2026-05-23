'use client'
import { useEffect, useState } from 'react'
import { Package, TrendingUp, Users, CheckCircle, Clock, XCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
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

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; color: string
}) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
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
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
      </div>
    )
  }

  const ov = data?.overview

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">GiriGo Courier — Gerung, Lombok Barat</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Orders"     value={ov?.total_orders     ?? 0} icon={Package}      color="bg-brand-500" />
        <StatCard label="Delivered"        value={ov?.total_delivered  ?? 0} icon={CheckCircle}  color="bg-success-500" />
        <StatCard label="Gross Revenue"    value={formatIDR(ov?.gross_revenue ?? 0)} icon={TrendingUp}   color="bg-purple-500" />
        <StatCard label="Success Rate"     value={`${ov?.success_rate ?? 0}%`} icon={Users}       color="bg-amber-500" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily orders chart */}
        <div className="card lg:col-span-2">
          <h3 className="text-base font-semibold mb-4">Daily Orders (30 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.daily?.slice(0, 14).reverse() ?? []}>
              <XAxis dataKey="date" tickFormatter={d => d.slice(5)} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [v, 'Orders']} />
              <Bar dataKey="total_orders" fill="#0077B6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top zones */}
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
                      className="h-1.5 bg-brand-500 rounded-full"
                      style={{ width: `${Math.min(100, (z.count / (data?.top_zones[0]?.count ?? 1)) * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-700">{z.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Courier leaderboard */}
      <div className="card">
        <h3 className="text-base font-semibold mb-4">Courier Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Courier', 'Status', 'Orders', 'Rating'].map(h => (
                  <th key={h} className="text-left pb-2 font-medium text-gray-500 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.couriers ?? []).map(c => (
                <tr key={c.name} className="hover:bg-gray-50">
                  <td className="py-2.5 pr-4 font-medium">{c.name}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`badge badge-${c.status}`}>{c.status}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-700">{c.total_orders}</td>
                  <td className="py-2.5 text-yellow-600 font-medium">⭐ {c.rating}</td>
                </tr>
              ))}
              {!data?.couriers?.length && (
                <tr><td colSpan={4} className="py-8 text-center text-gray-400">No couriers yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
