'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Download } from 'lucide-react'
import { format } from 'date-fns'
import { formatIDR } from '@/lib/pricing'

// ─── Types ────────────────────────────────────────────────────────────────────
interface LedgerRow {
  order_code:    string
  created_at:    string
  delivery_fee:  number
  courier_share:  number
  platform_share: number
  cod_amount:    number
  payout_status: string
  courier_name:  string
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

// ─── CSV builder ──────────────────────────────────────────────────────────────
function buildCSV(rows: LedgerRow[]): string {
  const headers = ['Order #', 'Date', 'Courier', 'Total Fee', 'Courier 85%', 'Platform 15%', 'COD', 'Status']
  const lines = [
    headers.join(','),
    ...rows.map(r => [
      r.order_code,
      format(new Date(r.created_at), 'dd/MM/yyyy HH:mm'),
      `"${r.courier_name}"`,
      r.delivery_fee,
      r.courier_share,
      r.platform_share,
      r.cod_amount,
      r.payout_status,
    ].join(',')),
  ]
  return lines.join('\n')
}

function triggerCSVDownload(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const today = new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10)

  // Daily export state
  const [dailyDate,    setDailyDate]    = useState(today)
  const [dailyLoading, setDailyLoading] = useState(false)
  const [dailyError,   setDailyError]   = useState('')

  // Range export state
  const [rangeFrom,    setRangeFrom]    = useState(today)
  const [rangeTo,      setRangeTo]      = useState(today)
  const [rangeLoading, setRangeLoading] = useState(false)
  const [rangeError,   setRangeError]   = useState('')

  // ── Download daily ─────────────────────────────────────────────────────
  const downloadDaily = async () => {
    setDailyLoading(true)
    setDailyError('')
    try {
      const res  = await fetch(`/api/finance/ledger?date=${dailyDate}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to fetch')
      const rows: LedgerRow[] = json.rows ?? []
      if (rows.length === 0) {
        setDailyError('Tidak ada transaksi pada tanggal ini.')
        return
      }
      triggerCSVDownload(buildCSV(rows), `ledger-${dailyDate}.csv`)
    } catch (e: any) {
      setDailyError(e.message)
    } finally {
      setDailyLoading(false)
    }
  }

  // ── Download range ─────────────────────────────────────────────────────
  const downloadRange = async () => {
    if (rangeFrom > rangeTo) {
      setRangeError('Tanggal "dari" harus sebelum "sampai".')
      return
    }
    setRangeLoading(true)
    setRangeError('')
    try {
      // Fetch each date in range and merge rows
      const allRows: LedgerRow[] = []
      const start   = new Date(rangeFrom)
      const end     = new Date(rangeTo)
      const cursor  = new Date(start)

      while (cursor <= end) {
        const dateStr = cursor.toISOString().slice(0, 10)
        const res     = await fetch(`/api/finance/ledger?date=${dateStr}`)
        if (res.ok) {
          const json = await res.json()
          allRows.push(...(json.rows ?? []))
        }
        cursor.setDate(cursor.getDate() + 1)
      }

      if (allRows.length === 0) {
        setRangeError('Tidak ada transaksi dalam rentang tanggal ini.')
        return
      }

      // Summary footer row
      const total_fee      = allRows.reduce((s, r) => s + r.delivery_fee, 0)
      const courier_share  = allRows.reduce((s, r) => s + r.courier_share, 0)
      const platform_share = allRows.reduce((s, r) => s + r.platform_share, 0)
      const cod_total      = allRows.reduce((s, r) => s + r.cod_amount, 0)

      const csv = buildCSV(allRows) + `\n\nSUMMARY,,,,${total_fee},${courier_share},${platform_share},${cod_total}`
      triggerCSVDownload(csv, `ledger-${rangeFrom}-to-${rangeTo}.csv`)
    } catch (e: any) {
      setRangeError(e.message)
    } finally {
      setRangeLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-5">
      {/* ── Header ── */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reports &amp; Export</h2>
        <p className="text-xs text-gray-400 mt-0.5">Download laporan keuangan dalam format CSV</p>
      </div>

      {/* ── Sub-tab nav ── */}
      <FinanceTabNav />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Daily Export ─────────────────────────────────────────────── */}
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center">
              <FileText size={18} className="text-brand-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Export Daily Summary</h3>
              <p className="text-xs text-gray-400">Semua transaksi dalam satu hari</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal</label>
              <input
                type="date"
                value={dailyDate}
                max={today}
                onChange={e => { setDailyDate(e.target.value); setDailyError('') }}
                className="input w-full"
              />
            </div>

            {dailyError && (
              <p className="text-xs text-red-500">{dailyError}</p>
            )}

            <button
              onClick={downloadDaily}
              disabled={dailyLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Download size={15} />
              {dailyLoading ? 'Mengunduh...' : 'Download CSV'}
            </button>
          </div>
        </div>

        {/* ── Range Export ──────────────────────────────────────────────── */}
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
              <FileText size={18} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Export Date Range</h3>
              <p className="text-xs text-gray-400">Semua transaksi dalam rentang tanggal</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Dari</label>
                <input
                  type="date"
                  value={rangeFrom}
                  max={today}
                  onChange={e => { setRangeFrom(e.target.value); setRangeError('') }}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sampai</label>
                <input
                  type="date"
                  value={rangeTo}
                  max={today}
                  onChange={e => { setRangeTo(e.target.value); setRangeError('') }}
                  className="input w-full"
                />
              </div>
            </div>

            {rangeError && (
              <p className="text-xs text-red-500">{rangeError}</p>
            )}

            <button
              onClick={downloadRange}
              disabled={rangeLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Download size={15} />
              {rangeLoading ? 'Mengunduh...' : 'Download CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Info note ── */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700">
        <strong>Catatan:</strong> File CSV berisi semua order dengan status "delivered" pada periode yang dipilih,
        termasuk breakdown fee kurir (85%) dan platform (15%), serta informasi pembayaran COD.
      </div>
    </div>
  )
}
