'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Package, Users, X, Clock } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderResult = {
  id: string
  order_code: string
  status: string
  created_at: string
  customers?: { name: string } | null
}

type CourierResult = {
  id: string
  name: string
  status: string
  phone: string
}

type Results = {
  orders: OrderResult[]
  couriers: CourierResult[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 1)   return 'baru saja'
  if (mins  < 60)  return `${mins}m lalu`
  if (hours < 24)  return `${hours}j lalu`
  return `${days}h lalu`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GroupLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 pt-4 pb-1.5">
      <Icon size={12} className="text-gray-300" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</span>
    </div>
  )
}

function OrderRow({
  order,
  onClose,
  focused,
}: {
  order: OrderResult
  onClose: () => void
  focused: boolean
}) {
  const router = useRouter()

  function go() {
    router.push(`/admin/orders/${order.id}`)
    onClose()
  }

  return (
    <button
      onClick={go}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
        ${focused ? 'bg-brand-50' : 'hover:bg-gray-50'}`}
    >
      <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
        <Package size={14} className="text-brand-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800 font-mono">{order.order_code}</span>
          {/* @ts-ignore — status union is compatible */}
          <StatusBadge status={order.status as Parameters<typeof StatusBadge>[0]['status']} size="sm" />
        </div>
        <p className="text-[12px] text-gray-400 truncate mt-0.5">
          {order.customers?.name ?? 'Pelanggan tidak diketahui'}
        </p>
      </div>
      <div className="flex items-center gap-1 text-[11px] text-gray-300 shrink-0">
        <Clock size={10} />
        <span>{relativeTime(order.created_at)}</span>
      </div>
    </button>
  )
}

function CourierRow({
  courier,
  onClose,
  focused,
}: {
  courier: CourierResult
  onClose: () => void
  focused: boolean
}) {
  const router = useRouter()

  function go() {
    router.push(`/admin/couriers/${courier.id}`)
    onClose()
  }

  return (
    <button
      onClick={go}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
        ${focused ? 'bg-brand-50' : 'hover:bg-gray-50'}`}
    >
      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0
        text-emerald-700 text-sm font-bold">
        {courier.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">{courier.name}</span>
          {/* @ts-ignore */}
          <StatusBadge status={courier.status as Parameters<typeof StatusBadge>[0]['status']} size="sm" />
        </div>
        <p className="text-[12px] text-gray-400 mt-0.5">{courier.phone}</p>
      </div>
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface GlobalSearchProps {
  open: boolean
  onClose: () => void
}

export default function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<Results>({ orders: [], couriers: [] })
  const [loading, setLoading] = useState(false)
  const [focusIdx, setFocusIdx] = useState(0)

  const inputRef   = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults({ orders: [], couriers: [] })
      setFocusIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Debounced fetch
  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults({ orders: [], couriers: [] })
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [ordersRes, couriersRes] = await Promise.all([
        fetch(`/api/orders?limit=3&q=${encodeURIComponent(q)}`).then(r => r.ok ? r.json() : { data: [] }),
        fetch(`/api/couriers?limit=3&q=${encodeURIComponent(q)}`).then(r => r.ok ? r.json() : { data: [] }),
      ])

      setResults({
        orders:   Array.isArray(ordersRes.data)   ? ordersRes.data.slice(0, 3)   : [],
        couriers: Array.isArray(couriersRes.data)  ? couriersRes.data.slice(0, 3)  : [],
      })
    } catch {
      setResults({ orders: [], couriers: [] })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchResults(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, fetchResults])

  // Keyboard navigation
  const totalItems = results.orders.length + results.couriers.length

  useEffect(() => {
    if (!open) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusIdx(i => (i + 1) % Math.max(totalItems, 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusIdx(i => (i - 1 + Math.max(totalItems, 1)) % Math.max(totalItems, 1))
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, totalItems])

  if (!open) return null

  const hasResults = results.orders.length > 0 || results.couriers.length > 0
  const isEmpty    = !loading && query.trim() && !hasResults

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 bg-brand-900/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      {/* Modal */}
      <div
        className="bg-white rounded-xl shadow-2xl w-[640px] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search size={16} className={`shrink-0 transition-colors ${loading ? 'text-brand-500 animate-pulse' : 'text-gray-400'}`} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setFocusIdx(0) }}
            placeholder="Cari order, kurir, pelanggan..."
            className="flex-1 text-base text-gray-800 placeholder-gray-400 outline-none font-medium
              bg-transparent"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus() }}
              className="text-gray-300 hover:text-gray-500 transition-colors"
            >
              <X size={15} />
            </button>
          )}
          <kbd className="hidden sm:flex items-center text-[10px] font-medium text-gray-300
            border border-gray-200 rounded px-1.5 py-1 leading-none">
            Esc
          </kbd>
        </div>

        {/* Results body */}
        <div className="max-h-[420px] overflow-y-auto">

          {/* Empty query — placeholder hints */}
          {!query.trim() && (
            <div className="px-4 py-8 text-center">
              <Search size={28} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-400">Ketik untuk mencari</p>
              <p className="text-[12px] text-gray-300 mt-1">Order, kurir, atau pelanggan</p>
            </div>
          )}

          {/* Empty results */}
          {isEmpty && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-medium text-gray-400">Tidak ada hasil</p>
              <p className="text-[12px] text-gray-300 mt-1">Coba kata kunci lain</p>
            </div>
          )}

          {/* Orders group */}
          {results.orders.length > 0 && (
            <div>
              <GroupLabel icon={Package} label="Orders" />
              {results.orders.map((order, i) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  onClose={onClose}
                  focused={focusIdx === i}
                />
              ))}
            </div>
          )}

          {/* Couriers group */}
          {results.couriers.length > 0 && (
            <div>
              <GroupLabel icon={Users} label="Kurir" />
              {results.couriers.map((courier, i) => (
                <CourierRow
                  key={courier.id}
                  courier={courier}
                  onClose={onClose}
                  focused={focusIdx === results.orders.length + i}
                />
              ))}
            </div>
          )}

          {/* Footer hint */}
          {hasResults && (
            <div className="flex items-center justify-end gap-4 px-4 py-2.5 border-t border-gray-50">
              <span className="text-[11px] text-gray-300 flex items-center gap-1">
                <kbd className="border border-gray-200 rounded px-1 text-gray-300">↑↓</kbd>
                navigasi
              </span>
              <span className="text-[11px] text-gray-300 flex items-center gap-1">
                <kbd className="border border-gray-200 rounded px-1 text-gray-300">↵</kbd>
                buka
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
