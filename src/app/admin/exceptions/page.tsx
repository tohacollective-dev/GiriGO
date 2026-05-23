'use client'
import { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { formatIDR } from '@/lib/pricing'
import type { Order } from '@/types'

type ExceptionOrder = Order & { courier: any; customer: any }

export default function ExceptionsPage() {
  const [failed,    setFailed]    = useState<ExceptionOrder[]>([])
  const [pending,   setPending]   = useState<ExceptionOrder[]>([])
  const [loading,   setLoading]   = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [failRes, pendRes] = await Promise.all([
        fetch('/api/orders?status=failed&limit=50'),
        fetch('/api/orders?status=pending&limit=50'),
      ])
      const [failData, pendData] = await Promise.all([failRes.json(), pendRes.json()])
      setFailed(failData.data ?? [])
      setPending(pendData.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  async function reassignOrder(orderId: string) {
    await fetch('/api/dispatch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET ?? '',
      },
      body: JSON.stringify({ order_id: orderId }),
    })
    fetchData()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Exceptions</h2>
          <p className="text-sm text-gray-500 mt-0.5">Orders requiring manual intervention</p>
        </div>
        <button onClick={fetchData} className="btn-ghost flex items-center gap-2">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Pending too long */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-amber-500" />
          <h3 className="font-semibold">Pending Orders <span className="text-amber-500 ml-1">({pending.length})</span></h3>
        </div>
        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : !pending.length ? (
          <p className="text-gray-400 text-sm py-4 text-center">✅ Tidak ada order pending</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  {['Order ID', 'Customer', 'Pickup', 'Dropoff', 'Fee', 'Waktu', 'Aksi'].map(h => (
                    <th key={h} className="text-left pb-2 font-medium text-gray-500 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pending.map(o => (
                  <tr key={o.id} className="hover:bg-amber-50">
                    <td className="py-2.5 pr-4 font-mono font-semibold text-brand-500">{o.order_code}</td>
                    <td className="py-2.5 pr-4">{(o.customer as any)?.name ?? '—'}</td>
                    <td className="py-2.5 pr-4 max-w-[120px] truncate text-gray-600">{o.pickup_address}</td>
                    <td className="py-2.5 pr-4 max-w-[120px] truncate text-gray-600">{o.dropoff_address}</td>
                    <td className="py-2.5 pr-4 font-medium">{formatIDR(o.delivery_fee)}</td>
                    <td className="py-2.5 pr-4 text-gray-400 whitespace-nowrap">
                      {format(new Date(o.created_at), 'dd/MM HH:mm')}
                    </td>
                    <td className="py-2.5">
                      <button
                        onClick={() => reassignOrder(o.id)}
                        className="text-xs bg-brand-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-brand-600 transition-colors"
                      >
                        Dispatch Ulang
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Failed orders */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-red-500" />
          <h3 className="font-semibold">Failed Orders <span className="text-red-500 ml-1">({failed.length})</span></h3>
        </div>
        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : !failed.length ? (
          <p className="text-gray-400 text-sm py-4 text-center">✅ Tidak ada order gagal</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  {['Order ID', 'Customer', 'Pickup', 'Dropoff', 'Fee', 'Payment', 'Waktu'].map(h => (
                    <th key={h} className="text-left pb-2 font-medium text-gray-500 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {failed.map(o => (
                  <tr key={o.id} className="hover:bg-red-50">
                    <td className="py-2.5 pr-4 font-mono font-semibold text-danger-500">{o.order_code}</td>
                    <td className="py-2.5 pr-4">{(o.customer as any)?.name ?? '—'}</td>
                    <td className="py-2.5 pr-4 max-w-[120px] truncate text-gray-600">{o.pickup_address}</td>
                    <td className="py-2.5 pr-4 max-w-[120px] truncate text-gray-600">{o.dropoff_address}</td>
                    <td className="py-2.5 pr-4 font-medium">{formatIDR(o.delivery_fee)}</td>
                    <td className="py-2.5 pr-4 uppercase text-xs font-medium">{o.payment_method}</td>
                    <td className="py-2.5 text-gray-400 whitespace-nowrap">
                      {format(new Date(o.created_at), 'dd/MM HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
