'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wallet, RefreshCw } from 'lucide-react'
import { formatIDR } from '@/lib/pricing'
import { TableRowSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

// ─── Types ────────────────────────────────────────────────────────────────────
interface CourierCOD {
  courier_id:      string
  courier_name:    string
  total_cod:       number
  settled_cod:     number
  outstanding_cod: number
  order_count:     number
}

// ─── Sub-tab nav ──────────────────────────────────────────────────────────────
const FINANCE_TABS = [
  { href: '/admin/finance/ledger',  label: 'Ledger'           },
  { href: '/admin/finance/cod',     label: 'COD Rekonsiliasi' },
  { href: '/admin/finance/reports', label: 'Laporan'          },
]

function FinanceTabNav() {
  const path = usePathname()
  return (
    <div className="flex items-center gap-1 border-b border-gray-200">
      {FINANCE_TABS.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
            path.startsWith(tab.href)
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CODPage() {
  const [couriers, setCouriers] = useState<CourierCOD[]>([])
  const [loading,  setLoading]  = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/finance/cod')
      const json = await res.json()
      setCouriers(json.couriers ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const totalOutstanding = couriers.reduce((s, c) => s + c.outstanding_cod, 0)

  return (
    <div className="p-6 space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">COD Reconciliation</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Total outstanding:{' '}
            <span className={totalOutstanding > 0 ? 'text-amber-600 font-semibold' : 'text-gray-400'}>
              {formatIDR(totalOutstanding)}
            </span>
          </p>
        </div>
        <button
          onClick={fetchData}
          className="btn-ghost flex items-center gap-1.5"
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Sub-tab nav ── */}
      <FinanceTabNav />

      {/* ── Table ── */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Kurir', 'Total COD', 'Sudah Disetor', 'Outstanding', 'Jumlah Order'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && Array.from({ length: 4 }).map((_, i) => (
                <TableRowSkeleton key={i} cols={5} />
              ))}

              {!loading && couriers.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={Wallet}
                      title="Tidak ada data COD"
                      message="Belum ada order COD yang selesai diproses."
                    />
                  </td>
                </tr>
              )}

              {!loading && couriers.map(c => (
                <tr
                  key={c.courier_id}
                  className="hover:bg-gray-50/80 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-800">{c.courier_name}</td>
                  <td className="px-4 py-3 tabular-nums text-gray-700">{formatIDR(c.total_cod)}</td>
                  <td className="px-4 py-3 tabular-nums text-green-600 font-medium">{formatIDR(c.settled_cod)}</td>
                  <td className="px-4 py-3 tabular-nums">
                    <span className={c.outstanding_cod > 0 ? 'text-amber-600 font-semibold' : 'text-gray-400'}>
                      {c.outstanding_cod > 0 ? formatIDR(c.outstanding_cod) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 tabular-nums">{c.order_count}</td>
                </tr>
              ))}
            </tbody>

            {/* Summary footer */}
            {!loading && couriers.length > 0 && (
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td className="px-4 py-3 font-semibold text-gray-700 text-xs uppercase">Total</td>
                  <td className="px-4 py-3 font-semibold tabular-nums text-gray-800">
                    {formatIDR(couriers.reduce((s, c) => s + c.total_cod, 0))}
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums text-green-700">
                    {formatIDR(couriers.reduce((s, c) => s + c.settled_cod, 0))}
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums text-amber-600">
                    {formatIDR(totalOutstanding)}
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums text-gray-700">
                    {couriers.reduce((s, c) => s + c.order_count, 0)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
