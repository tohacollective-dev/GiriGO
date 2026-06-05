// =============================================================================
// Order state machine — defines valid status transitions
// =============================================================================

import type { Order } from '@/types'

export type OrderStatus = 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled' | 'failed'

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:   ['assigned', 'cancelled', 'failed'],
  assigned:  ['picked_up', 'cancelled', 'failed'],
  picked_up: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
  failed:    [],
}

export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  const allowed = VALID_TRANSITIONS[from]
  return allowed?.includes(to) ?? false
}

export function validateTransition(
  currentStatus: string,
  newStatus: string,
): { valid: boolean; error?: string } {
  if (!currentStatus || !newStatus) {
    return { valid: false, error: 'Status is required' }
  }

  const from = currentStatus as OrderStatus
  const to   = newStatus as OrderStatus

  if (!VALID_TRANSITIONS[from]) {
    return { valid: false, error: `Status "${from}" is not a valid order status` }
  }

  if (from === to) {
    return { valid: false, error: `Order is already "${to}"` }
  }

  if (!isValidTransition(from, to)) {
    const allowed = VALID_TRANSITIONS[from].join(', ')
    return {
      valid: false,
      error: `Cannot transition from "${from}" to "${to}". Allowed: ${allowed}`,
    }
  }

  return { valid: true }
}

export const VALID_STATUSES = Object.keys(VALID_TRANSITIONS) as OrderStatus[]
