'use client'
import {
  useEffect, useState, useCallback, useRef, Suspense,
} from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Search, Package, Eye, UserCheck, X, Download,
  ChevronLeft, ChevronRight, Star, CheckSquare, Square,
  AlertTriangle, Plus,
} from 'lucide-react'
import { format } from 'date-fns'
import { formatIDR } from '@/lib/pricing'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { TableRowSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Order, Courier } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type TabStatus = '' | 'pending' | 'assigned' | 'delivered' | 'cancelled'

interface TabDef {
  label:  string
  value:  TabStatus
  icon?:  React.ReactNode
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: TabDef[] = [
  { label: 'All',           value: ''          },
  { label: 'Pending',       value: 'pending',  icon: <AlertTriangle size={12} className="text-orange-400" /> },
  { label: 'Active',        value: 'assigned'  },
  { label: 'Delivered',     value: 'delivered' },
  { label: 'Failed/Issues', value: 'cancelled' },
]

const PAGE_SIZE = 20

// ─── Helpers ──────────────────────────────────────────────────────────────────

function courierScore(c: Courier): number {
  // Rating score: 0–5 mapped to 0–100
  return Math.round((c.rating ?? 0) * 20)
}

function exportCSV(rows: Order[]) {
  const header = [
    'Order Code', 'Customer', 'Pickup', 'Dropoff',
    'Fee', 'Payment', 'Status', 'Courier', 'Date',
  ]
  const lines = rows.map(o => [
    o.order_code,
    (o.customer as any)?.name ?? '',
    o.pickup_address,
    o.dropoff_address,
    String(o.delivery_fee),
    o.payment_method,
    o.status,
    (o.courier as any)?.user?.name ?? '',
    format(new Date(o.created_at), 'yyyy-MM-dd HH:mm'),
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))

  const csv  = [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `girigocourier-orders-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastMsg { id: number; message: string; type: 'success' | 'error' | 'info' }

function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const counter = useRef(0)

  const show = useCallback((message: string, type: ToastMsg['type'] = 'info') => {
    const id = ++counter.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  return { toasts, show }
}

function Toaster({ toasts }: { toasts: ToastMsg[] }) {
  if (!toasts.length) return null
  return (
    <div className="fixed top-5 right-5 z-[9999] space-y-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast pointer-events-auto ${
            t.type === 'success' ? 'border-green-200' :
            t.type === 'error'   ? 'border-red-200'   : 'border-blue-200'
          }`}
        >
          <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
            t.type === 'success' ? 'bg-green-500' :
            t.type === 'error'   ? 'bg-red-500'   : 'bg-blue-500'
          }`} />
          <p className="text-sm text-gray-800 font-medium">{t.message}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Cancel Confirm Dialog ────────────────────────────────────────────────────

function ConfirmDialog({
  orderCode,
  onConfirm,
  onCancel,
  loading,
}: {
  orderCode: string
  onConfirm: () => void
  onCancel:  () => void
  loading:   boolean
}) {
  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <X size={18} className="text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Cancel Order</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Order <span className="font-mono font-bold text-brand-600">{orderCode}</span> will be cancelled.
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-5">
          Tindakan ini tidak dapat dibatalkan. Yakin ingin melanjutkan?
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1" disabled={loading}>
            Batal
          </button>
          <button onClick={onConfirm} className="btn-danger flex-1" disabled={loading}>
            {loading ? 'Cancelling…' : 'Ya, Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Assign Courier Panel ─────────────────────────────────────────────────────

interface AssignPanelProps {
  order:    Order | null
  onClose:  () => void
  onAssign: (orderId: string, courierId: string, courierName: string) => void
}

function AssignCourierPanel({ order, onClose, onAssign }: AssignPanelProps) {
  const [couriers, setCouriers] = useState<(Courier & { user: any })[]>([])
  const [loading,  setLoading]  = useState(true)
  const [assigning, setAssigning] = useState<string | null>(null)

  useEffect(() => {
    if (!order) return
    setLoading(true)
    fetch('/api/couriers?status=online&limit=50')
      .then(r => r.json())
      .then(d => setCouriers(d.data ?? []))
      .finally(() => setLoading(false))
  }, [order])

  if (!order) return null

  const handleAssign = async (courier: Courier & { user: any }) => {
    setAssigning(courier.id)
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ courier_id: courier.id, status: 'assigned' }),
      })
      if (!res.ok) throw new Error('Gagal assign kurir')
      onAssign(order.id, courier.id, courier.user?.name ?? 'Kurir')
    } finally {
      setAssigning(null)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[700] bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-[750] w-[400px] bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-900">Assign Kurir</p>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{order.order_code}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          )}

          {!loading && couriers.length === 0 && (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <UserCheck size={22} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">Tidak ada kurir online</p>
              <p className="text-xs text-gray-400 mt-1">Semua kurir sedang offline atau busy.</p>
            </div>
          )}

          {!loading && couriers.map(courier => {
            const score    = courierScore(courier)
            const initial  = (courier.user?.name ?? 'K').charAt(0).toUpperCase()
            const isMe     = assigning === courier.id
            const stars    = Math.round(courier.rating ?? 0)

            return (
              <div
                key={courier.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all group"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {initial}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {courier.user?.name ?? '—'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {/* Status dot */}
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    <span className="text-xs text-green-600 font-medium">Online</span>
                    {/* Stars */}
                    <span className="flex items-center gap-0.5 ml-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={10}
                          className={i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}
                        />
                      ))}
                    </span>
                    <span className="text-xs text-gray-400 ml-0.5">Score: {score}</span>
                  </div>
                </div>

                {/* Assign btn */}
                <button
                  onClick={() => handleAssign(courier)}
                  disabled={isMe || assigning !== null}
                  className="btn-primary text-xs px-3 py-1.5 shrink-0"
                >
                  {isMe ? '…' : 'Assign'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {couriers.length} kurir online tersedia
          </p>
        </div>
      </div>
    </>
  )
}

// ─── Bulk Assign Courier Panel ────────────────────────────────────────────────

interface BulkAssignPanelProps {
  orderIds: string[]
  orderCount: number
  onClose:  () => void
  onDone:   (assigned: number, courierName: string) => void
}

function BulkAssignPanel({ orderIds, orderCount, onClose, onDone }: BulkAssignPanelProps) {
  const [couriers,  setCouriers]  = useState<(Courier & { user: any })[]>([])
  const [loading,   setLoading]   = useState(true)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch('/api/couriers?status=online&limit=50')
      .then(r => r.json())
      .then(d => setCouriers(d.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  const handleBulkAssign = async (courier: Courier & { user: any }) => {
    setAssigning(true)
    try {
      const res = await fetch('/api/orders/batch', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          action:     'assign',
          order_ids:  orderIds,
          courier_id: courier.id,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'Gagal assign kurir')
      onDone(result.updated ?? 0, courier.user?.name ?? 'Kurir')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[700] bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 bottom-0 z-[750] w-[400px] bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-900">Bulk Assign Kurir</p>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{orderCount} orders selected</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          )}

          {!loading && couriers.length === 0 && (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <UserCheck size={22} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">Tidak ada kurir online</p>
              <p className="text-xs text-gray-400 mt-1">Semua kurir sedang offline atau busy.</p>
            </div>
          )}

          {!loading && couriers.map(courier => {
            const score    = courierScore(courier)
            const initial  = (courier.user?.name ?? 'K').charAt(0).toUpperCase()
            const stars    = Math.round(courier.rating ?? 0)

            return (
              <div
                key={courier.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {initial}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {courier.user?.name ?? '—'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    <span className="text-xs text-green-600 font-medium">Online</span>
                    <span className="flex items-center gap-0.5 ml-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={10}
                          className={i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}
                        />
                      ))}
                    </span>
                    <span className="text-xs text-gray-400 ml-0.5">Score: {score}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleBulkAssign(courier)}
                  disabled={assigning}
                  className="btn-primary text-xs px-3 py-1.5 shrink-0"
                >
                  {assigning ? '…' : `Assign ${orderCount}`}
                </button>
              </div>
            )
          })}
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {couriers.length} kurir online tersedia
          </p>
        </div>
      </div>
    </>
  )
}

// ─── Bulk Cancel Dialog ───────────────────────────────────────────────────────

function BulkCancelDialog({
  count,
  onConfirm,
  onCancel,
  loading,
}: {
  count:    number
  onConfirm: () => void
  onCancel:  () => void
  loading:   boolean
}) {
  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <X size={18} className="text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Cancel Orders</p>
            <p className="text-xs text-gray-500 mt-0.5">
              <span className="font-mono font-bold text-brand-600">{count}</span> orders will be cancelled.
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-5">
          Tindakan ini tidak dapat dibatalkan. Yakin ingin melanjutkan?
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1" disabled={loading}>
            Batal
          </button>
          <button onClick={onConfirm} className="btn-danger flex-1" disabled={loading}>
            {loading ? 'Cancelling…' : 'Ya, Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Content ─────────────────────────────────────────────────────────────

function OrdersContent() {
  const router  = useRouter()
  const params  = useSearchParams()

  // Data
  const [orders,  setOrders]  = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // UI state
  const [search,      setSearch]      = useState('')
  const [dateFilter,  setDateFilter]  = useState('')
  const [courierFilter, setCourierFilter] = useState('')
  const [page,        setPage]        = useState(1)
  const [selected,    setSelected]    = useState<Set<string>>(new Set())
  const [assignOrder,   setAssignOrder]   = useState<Order | null>(null)
  const [cancelOrder,   setCancelOrder]   = useState<Order | null>(null)
  const [cancelling,    setCancelling]    = useState(false)
  const [bulkAssign,    setBulkAssign]    = useState(false)
  const [bulkCancel,    setBulkCancel]    = useState(false)
  const [bulkLoading,   setBulkLoading]   = useState(false)
  const { toasts, show: showToast }       = useToast()

  const activeTab = (params.get('status') ?? '') as TabStatus

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setSelected(new Set())
    try {
      const res  = await fetch('/api/orders?limit=500')
      const data = await res.json()
      setOrders(data.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // Reset page when tab changes
  useEffect(() => { setPage(1) }, [activeTab, search, dateFilter, courierFilter])

  // ── Tab counts ─────────────────────────────────────────────────────────────

  const counts = {
    '':          orders.length,
    'pending':   orders.filter(o => o.status === 'pending').length,
    'assigned':  orders.filter(o => ['assigned', 'picked_up'].includes(o.status)).length,
    'delivered': orders.filter(o => o.status === 'delivered').length,
    'cancelled': orders.filter(o => ['cancelled', 'failed'].includes(o.status)).length,
  } as Record<string, number>

  const setTab = (v: TabStatus) => {
    router.push(v ? `/admin/orders?status=${v}` : '/admin/orders')
  }

  // ── Filter + paginate ──────────────────────────────────────────────────────

  const filtered = orders.filter(o => {
    // Tab filter
    if (activeTab === 'pending'  && o.status !== 'pending') return false
    if (activeTab === 'assigned' && !['assigned', 'picked_up'].includes(o.status)) return false
    if (activeTab === 'delivered'&& o.status !== 'delivered') return false
    if (activeTab === 'cancelled'&& !['cancelled', 'failed'].includes(o.status)) return false

    // Search
    if (search) {
      const q    = search.toLowerCase()
      const name = (o.customer as any)?.name?.toLowerCase() ?? ''
      if (!o.order_code.toLowerCase().includes(q) && !name.includes(q)) return false
    }

    // Date filter
    if (dateFilter) {
      const d = format(new Date(o.created_at), 'yyyy-MM-dd')
      if (d !== dateFilter) return false
    }

    // Courier filter
    if (courierFilter) {
      const cname = (o.courier as any)?.user?.name?.toLowerCase() ?? ''
      if (!cname.includes(courierFilter.toLowerCase())) return false
    }

    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const pageStart  = (safePage - 1) * PAGE_SIZE
  const pageRows   = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  // ── Checkbox helpers ───────────────────────────────────────────────────────

  const allPageSelected = pageRows.length > 0 && pageRows.every(o => selected.has(o.id))

  const toggleAll = () => {
    if (allPageSelected) {
      setSelected(prev => {
        const next = new Set(prev)
        pageRows.forEach(o => next.delete(o.id))
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        pageRows.forEach(o => next.add(o.id))
        return next
      })
    }
  }

  const toggleRow = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Bulk actions ───────────────────────────────────────────────────────────

  const handleBulkAssignOpen  = () => setBulkAssign(true)
  const handleBulkCancelOpen = () => setBulkCancel(true)

  const handleBulkAssignDone = async (assigned: number, courierName: string) => {
    setBulkAssign(false)
    setSelected(new Set())
    showToast(`${assigned} orders di-assign ke ${courierName}`, 'success')
    fetchOrders()
  }

  const handleBulkCancelConfirm = async () => {
    setBulkLoading(true)
    try {
      const res = await fetch('/api/orders/batch', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          action:    'cancel',
          order_ids: Array.from(selected),
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'Gagal cancel orders')
      const failed = result.failed?.length ?? 0
      showToast(
        `${result.updated ?? 0} orders dibatalkan${failed > 0 ? `, ${failed} gagal` : ''}`,
        failed > 0 ? 'error' : 'success',
      )
      setBulkCancel(false)
      setSelected(new Set())
      fetchOrders()
    } catch (err: any) {
      showToast(err.message ?? 'Gagal cancel orders', 'error')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkExport  = () => {
    const rows = filtered.filter(o => selected.has(o.id))
    exportCSV(rows)
    showToast(`${rows.length} orders exported`, 'success')
  }

  // ── Cancel single order ────────────────────────────────────────────────────

  const handleCancel = async () => {
    if (!cancelOrder) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/orders/${cancelOrder.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'cancelled' }),
      })
      if (!res.ok) throw new Error('Gagal cancel order')
      showToast(`Order ${cancelOrder.order_code} dibatalkan`, 'success')
      setCancelOrder(null)
      fetchOrders()
    } catch (err: any) {
      showToast(err.message ?? 'Error', 'error')
    } finally {
      setCancelling(false)
    }
  }

  // ── Assign callback ────────────────────────────────────────────────────────

  const handleAssigned = (orderId: string, _courierId: string, courierName: string) => {
    setAssignOrder(null)
    showToast(`Kurir ${courierName} berhasil di-assign`, 'success')
    fetchOrders()
  }

  // ── Pagination helpers ─────────────────────────────────────────────────────

  const pageNumbers: (number | '…')[] = (() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const arr: (number | '…')[] = [1]
    if (safePage > 3) arr.push('…')
    for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) arr.push(i)
    if (safePage < totalPages - 2) arr.push('…')
    arr.push(totalPages)
    return arr
  })()

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <Toaster toasts={toasts} />

      <div className="p-6 space-y-5 pb-24">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package size={24} className="text-brand-500" />
              Orders
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Kelola semua pesanan pengiriman di Gerung
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/orders/new')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15} />
            Create Order
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-0 border-b border-gray-200 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setTab(tab.value)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                activeTab === tab.value
                  ? 'border-blue-500 text-blue-600 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
              {/* Count badge */}
              <span className={`ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold ${
                activeTab === tab.value
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {counts[tab.value] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search + filters row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search order/customer..."
              className="input pl-9"
            />
          </div>

          {/* Date filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="input w-auto"
            title="Filter by date"
          />

          {/* Courier filter */}
          <input
            value={courierFilter}
            onChange={e => setCourierFilter(e.target.value)}
            placeholder="Courier name..."
            className="input w-40"
            title="Filter by courier"
          />

          {/* Export CSV */}
          <button
            onClick={() => { exportCSV(filtered); showToast(`${filtered.length} rows exported`, 'success') }}
            className="btn-ghost flex items-center gap-2 shrink-0"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {/* Checkbox header */}
                  <th className="px-4 py-3 w-10">
                    <button
                      onClick={toggleAll}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title={allPageSelected ? 'Deselect all' : 'Select all'}
                    >
                      {allPageSelected
                        ? <CheckSquare size={16} className="text-blue-500" />
                        : <Square size={16} />
                      }
                    </button>
                  </th>
                  {['Order #', 'Customer', 'Status', 'Fee', 'Courier', 'Actions'].map(h => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {/* Loading state */}
                {loading && Array.from({ length: 6 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={7} />
                ))}

                {/* Empty state */}
                {!loading && pageRows.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={Package}
                        title="Tidak ada order"
                        message="Belum ada order yang cocok dengan filter yang dipilih."
                      />
                    </td>
                  </tr>
                )}

                {/* Data rows */}
                {!loading && pageRows.map(o => {
                  const isPending   = o.status === 'pending'
                  const isDelivered = o.status === 'delivered'
                  const isChecked   = selected.has(o.id)
                  const courierName = (o.courier as any)?.user?.name

                  return (
                    <tr
                      key={o.id}
                      className={`hover:bg-blue-50 transition-colors group cursor-default ${
                        isPending ? 'border-l-4 border-orange-400' : ''
                      } ${isChecked ? 'bg-blue-50/60' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3 w-10">
                        <button
                          onClick={() => toggleRow(o.id)}
                          className="text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          {isChecked
                            ? <CheckSquare size={16} className="text-blue-500" />
                            : <Square size={16} />
                          }
                        </button>
                      </td>

                      {/* Order # */}
                      <td className="px-4 py-3">
                        <span className={`font-mono text-xs font-bold text-brand-600 ${isDelivered ? 'opacity-60' : ''}`}>
                          {o.order_code}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className={`px-4 py-3 font-medium text-gray-800 ${isDelivered ? 'opacity-60' : ''}`}>
                        <div>
                          <p className="text-sm font-semibold">{(o.customer as any)?.name ?? '—'}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[160px]">{o.pickup_address}</p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className={`px-4 py-3 ${isDelivered ? 'opacity-60' : ''}`}>
                        <StatusBadge status={o.status as any} size="sm" />
                        <p className="text-[10px] text-gray-400 mt-1 tabular-nums">
                          {format(new Date(o.created_at), 'dd/MM HH:mm')}
                        </p>
                      </td>

                      {/* Fee */}
                      <td className={`px-4 py-3 tabular-nums ${isDelivered ? 'opacity-60' : ''}`}>
                        <p className="font-semibold text-gray-900">{formatIDR(o.delivery_fee)}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-medium mt-0.5">
                          {o.payment_method}
                        </p>
                      </td>

                      {/* Courier */}
                      <td className={`px-4 py-3 text-sm ${isDelivered ? 'opacity-60' : ''}`}>
                        {courierName
                          ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-[10px] font-bold text-brand-600 shrink-0">
                                {courierName.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-gray-700 text-xs font-medium truncate max-w-[100px]">
                                {courierName}
                              </span>
                            </div>
                          )
                          : <span className="text-gray-300 text-xs">—</span>
                        }
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100">
                          {/* View */}
                          <button
                            onClick={() => router.push(`/admin/orders/${o.id}`)}
                            title="View"
                            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center transition-colors text-gray-500"
                          >
                            <Eye size={13} />
                          </button>

                          {/* Assign */}
                          <button
                            onClick={() => setAssignOrder(o)}
                            title="Assign Courier"
                            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-green-100 hover:text-green-600 flex items-center justify-center transition-colors text-gray-500"
                          >
                            <UserCheck size={13} />
                          </button>

                          {/* Cancel */}
                          {!['delivered', 'cancelled', 'failed'].includes(o.status) && (
                            <button
                              onClick={() => setCancelOrder(o)}
                              title="Cancel Order"
                              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-colors text-gray-500"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="btn-ghost px-2 py-1.5 disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>

              {pageNumbers.map((n, i) =>
                n === '…'
                  ? <span key={`ellipsis-${i}`} className="px-2 text-gray-400">…</span>
                  : (
                    <button
                      key={n}
                      onClick={() => setPage(n as number)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        safePage === n
                          ? 'bg-blue-500 text-white'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {n}
                    </button>
                  )
              )}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="btn-ghost px-2 py-1.5 disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk action bar — fixed bottom, shown when any selected */}
      {selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-[600] pointer-events-none flex justify-center pb-4 px-4">
          <div className="pointer-events-auto bg-gray-900 text-white rounded-2xl shadow-2xl flex items-center gap-4 px-5 py-3">
            <span className="text-sm font-semibold text-white/90">
              {selected.size} selected
            </span>
            <div className="w-px h-5 bg-white/20" />
            <button
              onClick={handleBulkAssignOpen}
              className="text-sm font-medium text-white/80 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <UserCheck size={14} />
              Assign All
            </button>
            <button
              onClick={handleBulkExport}
              className="text-sm font-medium text-white/80 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Download size={14} />
              Export Selected
            </button>
            <button
              onClick={handleBulkCancelOpen}
              className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5"
            >
              <X size={14} />
              Cancel Selected
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors ml-1"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Assign Courier Panel */}
      <AssignCourierPanel
        order={assignOrder}
        onClose={() => setAssignOrder(null)}
        onAssign={handleAssigned}
      />

      {/* Bulk Assign Panel */}
      {bulkAssign && (
        <BulkAssignPanel
          orderIds={Array.from(selected)}
          orderCount={selected.size}
          onClose={() => setBulkAssign(false)}
          onDone={handleBulkAssignDone}
        />
      )}

      {/* Cancel Confirm Dialog */}
      {cancelOrder && (
        <ConfirmDialog
          orderCode={cancelOrder.order_code}
          onConfirm={handleCancel}
          onCancel={() => setCancelOrder(null)}
          loading={cancelling}
        />
      )}

      {/* Bulk Cancel Dialog */}
      {bulkCancel && (
        <BulkCancelDialog
          count={selected.size}
          onConfirm={handleBulkCancelConfirm}
          onCancel={() => setBulkCancel(false)}
          loading={bulkLoading}
        />
      )}
    </>
  )
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-10 w-full" />
        <div className="card p-0 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-50">
              {Array.from({ length: 7 }).map((_, j) => (
                <div key={j} className={`skeleton h-4 ${j === 0 ? 'w-6' : j === 1 ? 'w-28' : 'w-20'}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
    }>
      <OrdersContent />
    </Suspense>
  )
}
