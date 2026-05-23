import { Clock, Truck, Package, CheckCircle, XCircle, AlertCircle, Wifi, WifiOff, Activity } from 'lucide-react'

type OrderStatus   = 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled' | 'failed'
type CourierStatus = 'online'  | 'busy'     | 'offline'
type Status = OrderStatus | CourierStatus

interface StatusBadgeProps {
  status: Status
  size?: 'sm' | 'md'
}

const CONFIG: Record<Status, { icon: React.ElementType; label: string; className: string }> = {
  pending:   { icon: Clock,        label: 'Pending',    className: 'badge badge-pending'   },
  assigned:  { icon: Truck,        label: 'Assigned',   className: 'badge badge-assigned'  },
  picked_up: { icon: Package,      label: 'Picked Up',  className: 'badge badge-picked_up' },
  delivered: { icon: CheckCircle,  label: 'Delivered',  className: 'badge badge-delivered' },
  cancelled: { icon: XCircle,      label: 'Cancelled',  className: 'badge badge-cancelled' },
  failed:    { icon: AlertCircle,  label: 'Failed',     className: 'badge badge-failed'    },
  online:    { icon: Wifi,         label: 'Online',     className: 'badge badge-online'    },
  busy:      { icon: Activity,     label: 'Busy',       className: 'badge badge-busy'      },
  offline:   { icon: WifiOff,      label: 'Offline',    className: 'badge badge-offline'   },
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const cfg = CONFIG[status]
  if (!cfg) return <span className="badge badge-cancelled">Unknown</span>

  const Icon    = cfg.icon
  const iconPx  = size === 'sm' ? 10 : 12

  return (
    <span className={cfg.className}>
      <Icon size={iconPx} strokeWidth={2.5} />
      {cfg.label}
    </span>
  )
}
