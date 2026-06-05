import { isValidTransition, validateTransition } from '@/lib/order-state'

describe('Order State Machine', () => {
  // ── Valid transitions ──────────────────────────────────────────────────────
  describe('valid transitions', () => {
    test('pending → assigned', () => {
      expect(isValidTransition('pending', 'assigned')).toBe(true)
    })
    test('pending → cancelled', () => {
      expect(isValidTransition('pending', 'cancelled')).toBe(true)
    })
    test('pending → failed', () => {
      expect(isValidTransition('pending', 'failed')).toBe(true)
    })
    test('assigned → picked_up', () => {
      expect(isValidTransition('assigned', 'picked_up')).toBe(true)
    })
    test('assigned → cancelled', () => {
      expect(isValidTransition('assigned', 'cancelled')).toBe(true)
    })
    test('assigned → failed', () => {
      expect(isValidTransition('assigned', 'failed')).toBe(true)
    })
    test('picked_up → delivered', () => {
      expect(isValidTransition('picked_up', 'delivered')).toBe(true)
    })
    test('picked_up → cancelled', () => {
      expect(isValidTransition('picked_up', 'cancelled')).toBe(true)
    })
  })

  // ── Invalid transitions ────────────────────────────────────────────────────
  describe('invalid transitions', () => {
    test('pending → delivered (skip steps)', () => {
      expect(isValidTransition('pending', 'delivered')).toBe(false)
    })
    test('pending → picked_up (skip steps)', () => {
      expect(isValidTransition('pending', 'picked_up')).toBe(false)
    })
    test('assigned → delivered (skip pickup)', () => {
      expect(isValidTransition('assigned', 'delivered')).toBe(false)
    })
    test('delivered → anything', () => {
      expect(isValidTransition('delivered', 'pending')).toBe(false)
      expect(isValidTransition('delivered', 'assigned')).toBe(false)
      expect(isValidTransition('delivered', 'cancelled')).toBe(false)
    })
    test('cancelled → anything', () => {
      expect(isValidTransition('cancelled', 'pending')).toBe(false)
      expect(isValidTransition('cancelled', 'assigned')).toBe(false)
      expect(isValidTransition('cancelled', 'delivered')).toBe(false)
    })
  })

  // ── Same-status rejection ──────────────────────────────────────────────────
  describe('same status', () => {
    test('rejects same-status transition', () => {
      const result = validateTransition('pending', 'pending')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('already')
    })
  })

  // ── Error messages ─────────────────────────────────────────────────────────
  describe('error messages', () => {
    test('includes allowed transitions in error', () => {
      const result = validateTransition('pending', 'delivered')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('assigned')
      expect(result.error).toContain('cancelled')
    })

    test('rejects unknown status', () => {
      const result = validateTransition('unknown_status', 'delivered')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('not a valid order status')
    })
  })
})
