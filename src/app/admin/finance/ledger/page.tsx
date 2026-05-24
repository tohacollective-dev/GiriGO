'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  DollarSign, TrendingUp, Landmark, AlertCircle,
  Download, CheckSquare, BookOpen, RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'
import { formatIDR } from '@/lib/pricing'
import { TableRowSkeleton, StatCardSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

// ─── Types ────────────────────────────────────────────────────────────────────
interface LedgerRow {
  order_id:      string
  order_code:    string
  created_at:    string
  delivery_fee:  number
  courier_share:  number
  platform_share: number
  cod_amount:    number
  payout_status: string
  courier_name:  string
}

interface LedgerSummary {
  total_fee:      number
  courier_share:  number
  platform_share: number
  cod_unpaid:     number
}

interface LedgerResponse {
  date:    string
  summary: LedgerSummary
  rows:    LedgerRow[]
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

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({
  label, value, icon: Icon, accent = 'text-gray-700',
}: {
  label: string; value: string; icon: React.ElementType; accent?: string
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
        <Icon size={20} className={accent} />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className={`text-xl font-bold tabular-nums mt-0.5 ${accent}`}>{value}</p>
      </div>
    </div>
  )
}

// ─── CSV export helper ────────────────────────────────────────────────────────
function downloadCSV(rows: LedgerRow[], date: string) {
  const headers = ['Order #', 'Date', 'Total Fee', 'Courier 85%', 'Platform 15%', 'COD', 'Status', 'Courier']
  const lines = [
    headers.join(','),
    ...rows.map(r => [
      r.order_code,
      format(new Date(r.created_at), 'dd/MM/yyyy HH:mm'),
      r.delivery_fee,
      r.courier_share,
      r.platform_share,
      r.cod_amount,
      r.payout_status,
      `"${r.courier_name}"`,
    ].join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: `ledger-${date}.csv` })
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LedgerPage() {
  const today = new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10)

  const [date,      setDate]      = useState(today)
  const [data,      setData]      = useState<LedgerResponse | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState<Set<string>>(new Set())
  const [settling,  setSettling]  = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setSelected(new Set())
    try {
      const res  = await fetch(`/api/finance/ledger?date=${date}`)
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Selection helpers ────────────────────────────────────────────────────
  const toggleRow = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const allUnpaidIds = (data?.rows ?? [])
    .filter(r => r.payout_status !== 'settled')
    .map(r => r.order_id)

  const allChecked =
    allUnpaidIds.length > 0 && allUnpaidIds.every(id => selected.has(id))

  const toggleAll = () => {
    if (allChecked) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allUnpaidIds))
    }
  }

  // ── Mark settled ─────────────────────────────────────────────────────────
  const markSettled = async () => {
    if (selected.size === 0) return
    setSettling(true)
    try {
      await fetch('/api/finance/cod', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ order_ids: Array.from(selected) }),
      })
      await fetchData()
    } finally {
      setSettling(false)
    }
  }

  const summary = data?.summary

  return (
    <div className="p-6 space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Finance — Ledger</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Periode: {date} &middot; {data?.rows.length ?? 0} transaksi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="input text-sm"
          />
          <button
            onClick={fetchData}
            className="btn-ghost flex items-center gap-1.5"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          {data && (
            <button
              onClick={() => downloadCSV(data.rows, date)}
              className="btn-secondary flex items-center gap-1.5"
            >
              <Download size={14} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* ── Sub-tab nav ── */}
      <FinanceTabNav />

      {/* ── KPI Cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Total Fee"
            value={formatIDR(summary?.total_fee ?? 0)}
            icon={DollarSign}
            accent="text-brand-600"
          />
          <KPICard
            label="Courier 85%"
            value={formatIDR(summary?.courier_share ?? 0)}
            icon={TrendingUp}
            accent="text-green-600"
          />
          <KPICard
            label="Platform 15%"
            value={formatIDR(summary?.platform_share ?? 0)}
            icon={Landmark}
            accent="text-blue-600"
          />
          <KPICard
            label="COD Belum Disetor"
            value={formatIDR(summary?.cod_unpaid ?? 0)}
            icon={AlertCircle}
            accent={(summary?.cod_unpaid ?? 0) > 0 ? 'text-amber-600' : 'text-gray-400'}
          />
        </div>
      )}

      {/* ── Bulk action bar ── */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <CheckSquare size={16} className="text-amber-600" />
          <span className="text-sm font-medium text-amber-800">
            {selected.size} order dipilih
          </span>
          <button
            onClick={markSettled}
            disabled={settling}
            className="btn-primary ml-auto flex items-center gap-1.5 text-sm"
          >
            {settling ? 'Menyimpan...' : '✓ Mark Selected as Settled'}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="btn-ghost text-sm"
          >
            Batal
          </button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    className="rounded"
                    disabled={allUnpaidIds.length === 0}
                  />
                </th>
                {['Order #', 'Tanggal', 'Kurir', 'Courier 85%', 'Platform 15%', 'COD', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} cols={8} />
              ))}

              {!loading && (data?.rows.length === 0) && (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={BookOpen}
                      title="Tidak ada transaksi"
                      message="Belum ada order yang selesai pada tanggal ini."
                    />
                  </td>
                </tr>
              )}

              {!loading && data?.rows.map(row => {
                const unpaid  = row.payout_status !== 'settled'
                const checked = selected.has(row.order_id)
                return (
                  <tr
                    key={row.order_id}
                    className={`hover:bg-gray-50/80 transition-colors ${
                      !unpaid ? 'opacity-50' : ''
                    }`}
                  >
                    <td className={`px-4 py-3 border-l-4 ${unpaid ? 'border-amber-400' : 'border-transparent'}`}>
                      {unpaid && (
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRow(row.order_id)}
                          className="rounded"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-brand-500">{row.order_code}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs tabular-nums whitespace-nowrap">
                      {format(new Date(row.created_at), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs font-medium">{row.courier_name}</td>
                    <td className="px-4 py-3 text-green-700 font-semibold tabular-nums">{formatIDR(row.courier_share)}</td>
                    <td className="px-4 py-3 text-blue-700 font-semibold tabular-nums">{formatIDR(row.platform_share)}</td>
                    <td className="px-4 py-3 text-gray-600 tabular-nums">
                      {row.cod_amount > 0 ? formatIDR(row.cod_amount) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        unpaid
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {unpaid ? 'UNPAID' : 'PAID'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
