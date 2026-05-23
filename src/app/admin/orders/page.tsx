'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { RefreshCw, Search, Package } from 'lucide-react'
import { format } from 'date-fns'
import { formatIDR } from '@/lib/pricing'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { TableRowSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Order } from '@/types'

type TabStatus = '' | 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled' | 'failed'

const TABS: { label: string; value: TabStatus; color?: string }[] = [
  { label: 'All',       value: '' },
  { label: 'Pending',   value: 'pending',   color: 'text-orange-500' },
  { label: 'Active',    value: 'assigned'   },
  { label: 'Delivered', value: 'delivered', color: 'text-green-600' },
  { label: 'Issues',    value: 'cancelled'  },
]

function OrdersContent() {
  const router       = useRouter()
  const params       = useSearchParams()
  const [orders,  setOrders]  = useState<Order[]>([])
  const [search,  setSearch]  = useState('')
  const [loading, setLoading] = useState(true)

  const activeTab = (params.get('status') ?? '') as TabStatus

  const setTab = (v: TabStatus) => {
    const url = v ? `/admin/orders?status=${v}` : '/admin/orders'
    router.push(url)
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const statusParam = activeTab === 'assigned' ? '' : activeTab
      const url  = `/api/orders?limit=200${statusParam ? `&status=${statusParam}` : ''}`
      const res  = await fetch(url)
      const data = await res.json()
      let rows   = data.data ?? [] as Order[]

      if (activeTab === 'assigned') {
        rows = rows.filter((o: Order) => ['assigned', 'picked_up'].includes(o.status))
      }
      if (activeTab === 'cancelled') {
        rows = rows.filter((o: Order) => ['cancelled', 'failed'].includes(o.status))
      }

      setOrders(rows)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const filtered = orders.filter(o =>
    !search ||
    o.order_code.toLowerCase().includes(search.toLowerCase()) ||
    (o.customer as any)?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {filtered.length} order{filtered.length !== 1 ? 's' : ''} ditampilkan
          </p>
        </div>
        <button onClick={fetchOrders} className="btn-ghost flex items-center gap-2" disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setTab(tab.value)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
              activeTab === tab.value
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari order atau customer..."
          className="input pl-9"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Order ID', 'Customer', 'Pickup', 'Dropoff', 'Jarak', 'Fee', 'Bayar', 'Status', 'Kurir', 'Tanggal'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} cols={10} />
              ))}
              {!loading && !filtered.length && (
                <tr>
                  <td colSpan={10}>
                    <EmptyState
                      icon={Package}
                      title="Tidak ada order"
                      message="Belum ada order yang cocok dengan filter yang dipilih."
                    />
                  </td>
                </tr>
              )}
              {!loading && filtered.map(o => (
                <tr key={o.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-semibold text-brand-500">{o.order_code}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{(o.customer as any)?.name ?? '—'}</td>
                  <td className="px-4 py-3 max-w-[140px] truncate text-gray-500 text-xs">{o.pickup_address}</td>
                  <td className="px-4 py-3 max-w-[140px] truncate text-gray-500 text-xs">{o.dropoff_address}</td>
                  <td className="px-4 py-3 text-gray-500 tabular-nums text-xs">{o.distance_km ? `${o.distance_km} km` : '—'}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800 tabular-nums">{formatIDR(o.delivery_fee)}</td>
                  <td className="px-4 py-3 text-xs uppercase font-medium text-gray-500">{o.payment_method}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status as any} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{(o.courier as any)?.user?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs tabular-nums">
                    {format(new Date(o.created_at), 'dd/MM HH:mm')}
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

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">Loading...</div>}>
      <OrdersContent />
    </Suspense>
  )
}
