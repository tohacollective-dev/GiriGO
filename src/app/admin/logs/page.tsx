'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  ClipboardList, CheckCircle, XCircle, Clock, AlertTriangle,
  ChevronLeft, ChevronRight, RefreshCw,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { TableRowSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

// ── Types ────────────────────────────────────────────────────────────────────

interface LogEntry {
  id:          string
  order_id:    string
  courier_id:  string | null
  attempt:     number
  score:       number | null
  result:      'accepted' | 'rejected' | 'timeout' | 'admin_alert'
  offered_at:  string
  responded_at: string | null
  order?:      { order_code: string } | null
  courier?:    { user: { name: string } | null } | null
}

type ResultFilter = '' | 'accepted' | 'rejected' | 'timeout' | 'admin_alert'

const PAGE_SIZE = 25

// ── Result Tab Config ────────────────────────────────────────────────────────

const RESULT_TABS: { label: string; value: ResultFilter; icon: React.ReactNode; color: string }[] = [
  { label: 'All',           value: '',             icon: <ClipboardList size={14} />,  color: 'text-gray-600'  },
  { label: 'Accepted',      value: 'accepted',     icon: <CheckCircle size={14} />,    color: 'text-green-600' },
  { label: 'Rejected',      value: 'rejected',     icon: <XCircle size={14} />,        color: 'text-red-600'   },
  { label: 'Timeout',       value: 'timeout',      icon: <Clock size={14} />,          color: 'text-amber-600' },
  { label: 'Admin Alert',   value: 'admin_alert',  icon: <AlertTriangle size={14} />,  color: 'text-orange-600'},
]

// ── Result Badge ──────────────────────────────────────────────────────────────

function ResultBadge({ result }: { result: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    accepted:    { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Accepted'    },
    rejected:    { bg: 'bg-red-50',    text: 'text-red-700',    label: 'Rejected'    },
    timeout:     { bg: 'bg-amber-50',  text: 'text-amber-700',  label: 'Timeout'     },
    admin_alert: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Admin Alert' },
  }
  const c = config[result] ?? { bg: 'bg-gray-50', text: 'text-gray-600', label: result }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ActivityLogsPage() {
  const [logs,      setLogs]      = useState<LogEntry[]>([])
  const [loading,   setLoading]   = useState(true)
  const [page,      setPage]      = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [filter,    setFilter]     = useState<ResultFilter>('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
      if (filter) params.set('result', filter)

      const res  = await fetch(`/api/admin/logs?${params}`)
      const data = await res.json()

      if (res.ok) {
        setLogs(data.data ?? [])
        setTotalPages(data.total_pages ?? 0)
        setTotalCount(data.count ?? 0)
      }
    } catch {
      // keep stale data on error
    } finally {
      setLoading(false)
    }
  }, [page, filter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Reset page on filter change
  useEffect(() => {
    setPage(1)
  }, [filter])

  // ── Helpers ────────────────────────────────────────────────────────────────

  function courierName(entry: LogEntry): string {
    return entry.courier?.user?.name ?? '—'
  }

  function orderCode(entry: LogEntry): string {
    return entry.order?.order_code ?? entry.order_id.slice(0, 8) + '…'
  }

  const pageNumbers: (number | '…')[] = (() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const arr: (number | '…')[] = [1]
    if (page > 3) arr.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) arr.push(i)
    if (page < totalPages - 2) arr.push('…')
    arr.push(totalPages)
    return arr
  })()

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-5 pb-24">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList size={24} className="text-brand-500" />
            Activity Logs
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Riwayat dispatch — semua percobaan assignment kurir
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="btn-ghost flex items-center gap-2"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-0 border-b border-gray-200 overflow-x-auto">
        {RESULT_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
              filter === tab.value
                ? `border-blue-500 ${tab.color} font-bold`
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      {!loading && (
        <p className="text-xs text-gray-400">
          {totalCount} entries total — page {page} of {Math.max(totalPages, 1)}
        </p>
      )}

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Time', 'Order', 'Courier', 'Att.', 'Score', 'Result'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && Array.from({ length: 6 }).map((_, i) => (
                <TableRowSkeleton key={i} cols={6} />
              ))}

              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={ClipboardList}
                      title="Belum ada log aktivitas"
                      message="Dispatch log akan muncul setelah ada percobaan assignment kurir."
                    />
                  </td>
                </tr>
              )}

              {!loading && logs.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-xs font-mono text-gray-600">
                      {format(new Date(entry.offered_at), 'dd/MM HH:mm:ss')}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {formatDistanceToNow(new Date(entry.offered_at), { addSuffix: true })}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-bold text-brand-600">
                      {orderCode(entry)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-800">
                      {courierName(entry)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                      {entry.attempt}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {entry.score != null ? (
                      <span className={`text-sm font-mono font-semibold ${
                        entry.score >= 80 ? 'text-green-600' :
                        entry.score >= 60 ? 'text-amber-600' : 'text-red-500'
                      }`}>
                        {entry.score.toFixed(0)}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ResultBadge result={entry.result} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost px-2 py-1.5 disabled:opacity-40"
            >
              <ChevronLeft size={15} />
            </button>
            {pageNumbers.map((n, i) =>
              n === '…'
                ? <span key={`e-${i}`} className="px-2 text-gray-400">…</span>
                : (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === n ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    {n}
                  </button>
                )
            )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-ghost px-2 py-1.5 disabled:opacity-40"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
