'use client'
import { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, Clock, RefreshCw, CheckCircle, Phone, RotateCcw, XCircle, StickyNote } from 'lucide-react'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { formatIDR } from '@/lib/pricing'
import type { Order } from '@/types'

// ── Types ────────────────────────────────────────────────────────────────────

type ExceptionOrder = Order & {
  courier?: { user?: { name?: string; phone?: string } } | null
  customer?: { name?: string; phone?: string } | null
}

type ExceptionType = 'TIMEOUT' | 'FAILED_DELIVERY'
type ActiveTab     = 'open' | 'in_review' | 'resolved'

interface ExceptionCard {
  type:    ExceptionType
  order:   ExceptionOrder
  tabSlot: ActiveTab
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const TIMEOUT_THRESHOLD_MIN = 10

function minutesSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
}

function slaLabel(order: ExceptionOrder, type: ExceptionType): string {
  const created = new Date(order.created_at)

  if (type === 'TIMEOUT') {
    const mins = minutesSince(order.created_at)
    return `${mins} min unresolved`
  }

  if (isToday(created))     return `Today ${format(created, 'HH:mm')}`
  if (isYesterday(created)) return `Yesterday ${format(created, 'HH:mm')}`
  return format(created, 'dd MMM HH:mm')
}

function waLink(phone: string | undefined | null): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '').replace(/^0/, '')
  const e164   = digits.startsWith('62') ? digits : `62${digits}`
  return `https://wa.me/${e164}`
}

// Tab slot assignment — for now pending = open, failed = open.
// Future: "in_review" and "resolved" could come from a separate flags table.
function toTabSlot(_order: ExceptionOrder, _type: ExceptionType): ActiveTab {
  return 'open'
}

// ── Skeleton ────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 border-l-4 border-l-gray-200 animate-pulse space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-5 w-20 bg-gray-200 rounded-full" />
        <div className="h-4 w-32 bg-gray-100 rounded" />
      </div>
      <div className="h-3 w-3/4 bg-gray-100 rounded" />
      <div className="h-3 w-1/2 bg-gray-100 rounded" />
      <div className="flex gap-2 pt-1">
        <div className="h-8 w-28 bg-gray-200 rounded-lg" />
        <div className="h-8 w-24 bg-gray-100 rounded-lg" />
      </div>
    </div>
  )
}

// ── Exception Card ───────────────────────────────────────────────────────────

function ExceptionCardView({
  card,
  onAssign,
  onCancel,
  onResolve,
  actionLoading,
}: {
  card:          ExceptionCard
  onAssign:      (id: string) => Promise<void>
  onCancel:      (id: string) => Promise<void>
  onResolve:     (id: string) => Promise<void>
  actionLoading: Record<string, boolean>
}) {
  const { type, order, tabSlot } = card
  const isTimeout = type === 'TIMEOUT'
  const busy      = actionLoading[order.id] ?? false

  const borderColor =
    tabSlot === 'open'      ? 'border-l-orange-400' :
    tabSlot === 'in_review' ? 'border-l-blue-400'   :
                              'border-l-green-400'

  const badgeCls = isTimeout
    ? 'bg-orange-100 text-orange-700 border border-orange-200'
    : 'bg-red-100 text-red-700 border border-red-200'

  const courierName = order.courier?.user?.name ?? null
  const customerWA  = waLink(order.customer?.phone)
  const courierWA   = waLink(order.courier?.user?.phone)
  const sla         = slaLabel(order, type)

  return (
    <div className={`rounded-xl border border-gray-100 bg-white shadow-sm border-l-4 ${borderColor} p-5 space-y-3 transition-all`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${badgeCls}`}>
            {isTimeout ? <Clock size={11} /> : <AlertTriangle size={11} />}
            {type.replace('_', ' ')}
          </span>
          <span className="font-mono font-semibold text-sm text-gray-800">
            {order.order_code}
          </span>
          {order.payment_method && (
            <span className="text-[11px] uppercase font-semibold text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
              {order.payment_method}
            </span>
          )}
        </div>
        {/* SLA timer */}
        <span className={`text-xs font-semibold whitespace-nowrap tabular-nums shrink-0 ${
          isTimeout
            ? minutesSince(order.created_at) > 20 ? 'text-red-500' : 'text-orange-500'
            : 'text-gray-400'
        }`}>
          {sla}
        </span>
      </div>

      {/* Body */}
      {isTimeout ? (
        <div className="text-sm text-gray-600 space-y-0.5">
          <p>
            <span className="font-medium text-gray-800">
              {order.customer?.name ?? 'Unknown customer'}
            </span>
            {' · '}Order still{' '}
            <span className="font-semibold text-orange-600 uppercase text-xs">PENDING</span>
            {' · '}{minutesSince(order.created_at)} min unresolved
          </p>
          <p className="text-xs text-gray-400 truncate">
            {order.pickup_address}
            {' → '}
            {order.dropoff_address}
          </p>
          <p className="text-xs text-gray-400">
            Fee: <span className="font-medium text-gray-600">{formatIDR(order.delivery_fee)}</span>
            {order.distance_km ? ` · ${order.distance_km} km` : ''}
          </p>
        </div>
      ) : (
        <div className="text-sm text-gray-600 space-y-0.5">
          {courierName && (
            <p>
              Kurir:{' '}
              <span className="font-semibold text-gray-800">{courierName}</span>
            </p>
          )}
          <p className="text-xs text-gray-400 truncate">
            {order.pickup_address}
            {' → '}
            {order.dropoff_address}
          </p>
          <p className="text-xs text-gray-400">
            Fee: <span className="font-medium text-gray-600">{formatIDR(order.delivery_fee)}</span>
            {order.distance_km ? ` · ${order.distance_km} km` : ''}
            {' · '}
            {format(new Date(order.created_at), 'dd MMM yyyy HH:mm')}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {isTimeout && (
          <>
            <button
              onClick={() => onAssign(order.id)}
              disabled={busy}
              className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
            >
              <RotateCcw size={12} className={busy ? 'animate-spin' : ''} />
              Assign Manually
            </button>
            <button
              onClick={() => onCancel(order.id)}
              disabled={busy}
              className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <XCircle size={12} />
              Cancel Order
            </button>
            {customerWA && (
              <a
                href={customerWA}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 text-green-700 hover:bg-green-50"
              >
                <Phone size={12} />
                Contact WA
              </a>
            )}
          </>
        )}

        {!isTimeout && (
          <>
            <button
              onClick={() => onAssign(order.id)}
              disabled={busy}
              className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
            >
              <RotateCcw size={12} className={busy ? 'animate-spin' : ''} />
              Reschedule
            </button>
            <button
              onClick={() => onResolve(order.id)}
              disabled={busy}
              className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 text-green-700 hover:bg-green-50 border border-green-200"
            >
              <CheckCircle size={12} />
              Mark Resolved
            </button>
            <button
              disabled
              className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 opacity-50 cursor-not-allowed"
            >
              <StickyNote size={12} />
              Add Note
            </button>
            {courierWA && (
              <a
                href={courierWA}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 text-green-700 hover:bg-green-50"
              >
                <Phone size={12} />
                Kurir WA
              </a>
            )}
            {customerWA && (
              <a
                href={customerWA}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 text-blue-700 hover:bg-blue-50"
              >
                <Phone size={12} />
                Customer WA
              </a>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ExceptionsPage() {
  const [failed,        setFailed]        = useState<ExceptionOrder[]>([])
  const [pending,       setPending]       = useState<ExceptionOrder[]>([])
  const [totalToday,    setTotalToday]    = useState(0)
  const [loading,       setLoading]       = useState(true)
  const [activeTab,     setActiveTab]     = useState<ActiveTab>('open')
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [failRes, pendRes, totalRes] = await Promise.all([
        fetch('/api/orders?status=failed&limit=50'),
        fetch('/api/orders?status=pending&limit=50'),
        fetch('/api/orders?limit=200'),
      ])
      const [failData, pendData, totalData] = await Promise.all([
        failRes.json(),
        pendRes.json(),
        totalRes.json(),
      ])

      const failedRows: ExceptionOrder[]  = failData.data  ?? []
      const pendingRows: ExceptionOrder[] = pendData.data  ?? []
      const allRows: Order[]              = totalData.data ?? []

      // Only count pending rows that have breached the threshold
      const timedOut = pendingRows.filter(
        o => minutesSince(o.created_at) >= TIMEOUT_THRESHOLD_MIN
      )

      setFailed(failedRows)
      setPending(timedOut)

      // Total orders today for exception rate KPI
      const todayStr = new Date().toISOString().slice(0, 10)
      const todayCount = allRows.filter(o => o.created_at.startsWith(todayStr)).length
      setTotalToday(todayCount)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30_000)
    return () => clearInterval(interval)
  }, [fetchData])

  // ── Actions ────────────────────────────────────────────────────────────────
  async function setOrderBusy(id: string, on: boolean) {
    setActionLoading(prev => ({ ...prev, [id]: on }))
  }

  async function handleAssign(orderId: string) {
    await setOrderBusy(orderId, true)
    try {
      await fetch('/api/dispatch', {
        method:  'POST',
        headers: {
          'Content-Type':   'application/json',
          'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET ?? '',
        },
        body: JSON.stringify({ order_id: orderId }),
      })
      await fetchData()
    } finally {
      await setOrderBusy(orderId, false)
    }
  }

  async function handleCancel(orderId: string) {
    await setOrderBusy(orderId, true)
    try {
      await fetch(`/api/orders/${orderId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'cancelled' }),
      })
      await fetchData()
    } finally {
      await setOrderBusy(orderId, false)
    }
  }

  async function handleResolve(orderId: string) {
    await setOrderBusy(orderId, true)
    try {
      await fetch(`/api/orders/${orderId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'cancelled' }),
      })
      await fetchData()
    } finally {
      await setOrderBusy(orderId, false)
    }
  }

  // ── Build exception cards ─────────────────────────────────────────────────
  const timeoutCards: ExceptionCard[] = pending.map(o => ({
    type:    'TIMEOUT',
    order:   o,
    tabSlot: toTabSlot(o, 'TIMEOUT'),
  }))

  const failedCards: ExceptionCard[] = failed.map(o => ({
    type:    'FAILED_DELIVERY',
    order:   o,
    tabSlot: toTabSlot(o, 'FAILED_DELIVERY'),
  }))

  const allCards = [...timeoutCards, ...failedCards]

  const openCards     = allCards.filter(c => c.tabSlot === 'open')
  const reviewCards   = allCards.filter(c => c.tabSlot === 'in_review')
  const resolvedCards = allCards.filter(c => c.tabSlot === 'resolved')

  const visibleCards =
    activeTab === 'open'      ? openCards     :
    activeTab === 'in_review' ? reviewCards   :
                                resolvedCards

  // ── Exception rate KPI ────────────────────────────────────────────────────
  const exceptionCount  = failed.length + pending.length
  const exceptionRate   = totalToday > 0
    ? parseFloat(((exceptionCount / totalToday) * 100).toFixed(1))
    : 0
  const kpiColor =
    exceptionRate > 10 ? 'text-red-600' :
    exceptionRate >  5 ? 'text-amber-600' :
                         'text-green-600'
  const kpiBg =
    exceptionRate > 10 ? 'bg-red-50 border-red-200' :
    exceptionRate >  5 ? 'bg-amber-50 border-amber-200' :
                         'bg-green-50 border-green-200'

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-5 max-w-4xl">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle size={22} className="text-orange-500" />
            Exceptions
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Orders requiring manual intervention · auto-refresh every 30s
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="btn-ghost flex items-center gap-2"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {(
          [
            { key: 'open',      label: 'Open',      count: openCards.length,     dotColor: 'bg-orange-400' },
            { key: 'in_review', label: 'In Review',  count: reviewCards.length,  dotColor: 'bg-blue-400'   },
            { key: 'resolved',  label: 'Resolved',   count: resolvedCards.length, dotColor: 'bg-green-400' },
          ] as const
        ).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.key
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[11px] font-bold text-white ${tab.dotColor}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Card grid */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : visibleCards.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center space-y-2">
          <CheckCircle size={40} className="text-green-400" />
          <p className="font-semibold text-gray-700 text-base">No exceptions today</p>
          <p className="text-sm text-gray-400">All orders are on track — nothing needs attention.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleCards.map(card => (
            <ExceptionCardView
              key={`${card.type}-${card.order.id}`}
              card={card}
              onAssign={handleAssign}
              onCancel={handleCancel}
              onResolve={handleResolve}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}

      {/* Exception Rate KPI */}
      {!loading && (
        <div className={`rounded-xl border px-5 py-3.5 flex items-center justify-between ${kpiBg}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className={kpiColor} />
            <span className="text-sm font-semibold text-gray-700">Exception Rate Today</span>
            <span className="text-xs text-gray-400">
              ({exceptionCount} exception{exceptionCount !== 1 ? 's' : ''} / {totalToday} orders)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-bold tabular-nums ${kpiColor}`}>
              {exceptionRate}%
            </span>
            <span className="text-xs text-gray-400 font-medium">target &lt; 5%</span>
          </div>
        </div>
      )}
    </div>
  )
}
