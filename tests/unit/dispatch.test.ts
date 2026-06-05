// Stub Supabase so module-level env-var guard doesn't throw in unit tests
jest.mock('@/lib/supabase', () => ({ supabase: {}, supabaseAdmin: {} }))

import { scoreCourier } from '@/lib/dispatch'
import type { CourierScore } from '@/types'

// We only test the pure scoring function — DB calls are tested in integration tests

const baseCourier = {
  id: 'courier-uuid-001',
  user_id: 'user-uuid-001',
  user: { name: 'Budi Santoso', phone: '6281234567890' },
  vehicle_type: 'motor' as const,
  vehicle_plate: 'DR 1234 AB',
  status: 'online' as const,
  current_lat: -8.6505,
  current_lng: 116.1205,
  rating: 4.8,
  total_orders: 120,
  total_earnings: 600000,
  active_orders: 0,
  completed_orders: 45,
  last_seen_at: new Date().toISOString(),
  zone: 'Gerung Kota',
  location_updated: null,
  is_verified: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const pickupLat = -8.6510
const pickupLng = 116.1210

describe('scoreCourier', () => {
  it('returns a CourierScore with all required fields', () => {
    const result = scoreCourier(baseCourier, pickupLat, pickupLng, 0)
    expect(result).toHaveProperty('courier')
    expect(result).toHaveProperty('total_score')
    expect(result).toHaveProperty('distance_km')
    expect(result).toHaveProperty('dist_score')
    expect(result).toHaveProperty('workload_score')
    expect(result).toHaveProperty('rating_score')
  })

  it('gives full distance score for courier very close to pickup', () => {
    const result = scoreCourier(baseCourier, pickupLat, pickupLng, 0)
    // Very close courier (< 0.1km) should get near-max dist_score (≈40)
    expect(result.dist_score).toBeGreaterThan(35)
  })

  it('gives zero distance score for courier > 5km away', () => {
    const farCourier = { ...baseCourier, current_lat: -8.700, current_lng: 116.200 }
    const result = scoreCourier(farCourier, pickupLat, pickupLng, 0)
    expect(result.dist_score).toBe(0)
  })

  it('penalizes workload correctly', () => {
    const noOrders   = scoreCourier(baseCourier, pickupLat, pickupLng, 0)
    const oneOrder   = scoreCourier(baseCourier, pickupLat, pickupLng, 1)
    const threeOrders = scoreCourier(baseCourier, pickupLat, pickupLng, 3)
    expect(noOrders.workload_score).toBe(30)
    expect(oneOrder.workload_score).toBe(20)
    expect(threeOrders.workload_score).toBe(0)
  })

  it('workload score never goes negative', () => {
    const result = scoreCourier(baseCourier, pickupLat, pickupLng, 99)
    expect(result.workload_score).toBeGreaterThanOrEqual(0)
  })

  it('calculates rating score correctly (4.8 rating → 4.8 * 6 = 28.8)', () => {
    const result = scoreCourier(baseCourier, pickupLat, pickupLng, 0)
    expect(result.rating_score).toBeCloseTo(4.8 * 6)
  })

  it('handles new courier with 0.0 rating (no rating yet)', () => {
    const newCourier = { ...baseCourier, rating: 0 }
    const result = scoreCourier(newCourier, pickupLat, pickupLng, 0)
    expect(result.rating_score).toBe(0)
    expect(result.total_score).toBeGreaterThanOrEqual(0)
  })

  it('total_score equals sum of component scores', () => {
    const result = scoreCourier(baseCourier, pickupLat, pickupLng, 1)
    const expected = result.dist_score + result.workload_score + result.rating_score
    expect(result.total_score).toBeCloseTo(expected)
  })

  it('closer courier outscores farther courier (same workload/rating)', () => {
    const nearCourier = { ...baseCourier, current_lat: -8.651, current_lng: 116.121 }
    const farCourier  = { ...baseCourier, current_lat: -8.680, current_lng: 116.140 }
    const nearScore = scoreCourier(nearCourier, pickupLat, pickupLng, 0).total_score
    const farScore  = scoreCourier(farCourier,  pickupLat, pickupLng, 0).total_score
    expect(nearScore).toBeGreaterThan(farScore)
  })

  it('idle courier outscores busy courier (same distance/rating)', () => {
    const idle  = scoreCourier(baseCourier, pickupLat, pickupLng, 0).total_score
    const busy  = scoreCourier(baseCourier, pickupLat, pickupLng, 2).total_score
    expect(idle).toBeGreaterThan(busy)
  })

  it('max possible score is 100 (0km + 0 active + 5.0 rating)', () => {
    const perfectCourier = {
      ...baseCourier,
      current_lat: pickupLat,
      current_lng: pickupLng,
      rating: 5.0,
    }
    const result = scoreCourier(perfectCourier, pickupLat, pickupLng, 0)
    // dist_score=40, workload_score=30, rating_score=30
    expect(result.total_score).toBeCloseTo(100, 0)
  })
})
