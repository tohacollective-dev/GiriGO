'use client'
import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { formatIDR } from '@/lib/pricing'
import type { Order } from '@/types'

const STATUSES = ['', 'pending', 'assigned', 'picked_up', 'delivered', 'cancelled', 'failed']

export default function OrdersPage() {
  const [orders,   setOrders]   = useState<Order[]>([])
  const [status,   setStatus]   = useState('')
  const [search,   setSearch]   = useState('')
  const [loading,  setLoading]  = useState(true)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const url = `/api/orders?limit=100${status ? `&status=${status}` : ''}`
    const res  = await fetch(url)
    const data = await res.json()
    setOrders(data.data ?? [])
    setLoading(false)
  }, [status])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const filtered = orders.filter(o =>
    !search ||
    o.order_code.toLowerCase().includes(search.toLowerCase()) ||
    (o.customer as any)?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Orders</h2>
        <button onClick={fetchOrders} className="btn-ghost flex items-center gap-2">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search order / customer..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={status} onChange={e => setStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {STATUSES.map(s => (
            <option key={s} value={s}>{s || 'All Statuses'}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Order ID', 'Customer', 'Pickup', 'Dropoff', 'Distance', 'Fee', 'Payment', 'Status', 'Courier', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr><td colSpan={10} className="py-10 text-center text-gray-400">Loading...</td></tr>
              )}
              {!loading && !filtered.length && (
                <tr><td colSpan={10} className="py-10 text-center text-gray-400">No orders found</td></tr>
              )}
              {filtered.map(o => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-brand-500">{o.order_code}</td>
                  <td className="px-4 py-3">{(o.customer as any)?.name ?? '—'}</td>
                  <td className="px-4 py-3 max-w-[140px] truncate text-gray-600">{o.pickup_address}</td>
                  <td className="px-4 py-3 max-w-[140px] truncate text-gray-600">{o.dropoff_address}</td>
                  <td className="px-4 py-3 text-gray-600">{o.distance_km ? `${o.distance_km} km` : '—'}</td>
                  <td className="px-4 py-3 font-medium">{formatIDR(o.delivery_fee)}</td>
                  <td className="px-4 py-3 uppercase text-xs font-medium">{o.payment_method}</td>
                  <td className="px-4 py-3">
                    <span className={`badge badge-${o.status}`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{(o.courier as any)?.user?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {format(new Date(o.created_at), 'dd/MM HH:mm')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3">Showing {filtered.length} of {orders.length} orders</p>
    </div>
  )
}
