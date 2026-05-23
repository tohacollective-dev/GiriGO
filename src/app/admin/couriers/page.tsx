'use client'
import { useEffect, useState } from 'react'
import { RefreshCw, Plus, Star, Truck } from 'lucide-react'
import type { Courier } from '@/types'

interface CourierRow extends Omit<Courier, 'user'> {
  user: { name: string; phone: string }
  vehicle_plate?: string
  zone?: string
}

export default function CouriersPage() {
  const [couriers, setCouriers] = useState<CourierRow[]>([])
  const [loading,  setLoading]  = useState(true)

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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Couriers</h2>
          <p className="text-sm text-gray-500 mt-0.5">{couriers.length} kurir terdaftar</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchCouriers} className="btn-ghost flex items-center gap-2">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Status summary pills */}
      <div className="flex gap-3 mb-6">
        {[
          { label: 'Online',  count: byStatus('online').length,  color: 'bg-green-100 text-green-700' },
          { label: 'Busy',    count: byStatus('busy').length,    color: 'bg-amber-100 text-amber-700' },
          { label: 'Offline', count: byStatus('offline').length, color: 'bg-gray-100 text-gray-500' },
        ].map(s => (
          <div key={s.label} className={`px-4 py-2 rounded-full text-sm font-semibold ${s.color}`}>
            {s.label}: {s.count}
          </div>
        ))}
      </div>

      {/* Couriers table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Courier', 'WhatsApp', 'Kendaraan', 'Status', 'Zone', 'Total Orders', 'Rating', 'Total Earnings'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr><td colSpan={8} className="py-10 text-center text-gray-400">Loading...</td></tr>
              )}
              {!loading && !couriers.length && (
                <tr>
                  <td colSpan={8} className="py-10 text-center">
                    <Truck size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-400">Belum ada kurir terdaftar</p>
                  </td>
                </tr>
              )}
              {couriers.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-xs">
                        {c.user.name[0]?.toUpperCase()}
                      </div>
                      {c.user.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-600">{c.user.phone}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{c.vehicle_type} · {c.vehicle_plate}</td>
                  <td className="px-4 py-3">
                    <span className={`badge badge-${c.status}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.zone ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold text-gray-700">{c.total_orders}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-yellow-500 font-semibold">
                      <Star size={13} fill="currentColor" />
                      {c.rating > 0 ? c.rating.toFixed(1) : '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-green-700">
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
