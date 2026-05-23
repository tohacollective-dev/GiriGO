// =============================================================================
// GiriGo — Pricing Engine
// Base: Rp 5,000 (0–2 km) + Rp 2,000/km thereafter
// Weight surcharge: 1–3 kg = 0%, 3–5 kg = +20%, >5 kg = +40%
// Revenue split: 85% courier / 15% platform
// =============================================================================

import type { PriceCalculation } from '@/types'

const BASE_FEE        = Number(process.env.BASE_DELIVERY_FEE  ?? 5000)
const PER_KM_RATE     = Number(process.env.PER_KM_RATE        ?? 2000)
const BASE_DISTANCE   = Number(process.env.BASE_DISTANCE_KM   ?? 2)
const COURIER_SHARE   = Number(process.env.COURIER_REVENUE_SHARE ?? 0.85)

// Weight multiplier tiers
function weightMultiplier(kg: number): number {
  if (kg <= 3) return 1.00
  if (kg <= 5) return 1.20
  return 1.40
}

/**
 * Calculate the full delivery fee breakdown.
 * All amounts are in IDR (integer, no decimal).
 */
export function calculatePrice(
  distanceKm: number,
  weightKg: number = 1.0
): PriceCalculation {
  if (distanceKm < 0) throw new Error('Distance cannot be negative')
  if (weightKg  <= 0) throw new Error('Weight must be positive')

  // Distance component
  const extraKm     = Math.max(0, distanceKm - BASE_DISTANCE)
  const distanceFee = BASE_FEE + Math.round(extraKm * PER_KM_RATE)

  // Weight surcharge on top of distance fee
  const multiplier    = weightMultiplier(weightKg)
  const rawTotal      = distanceFee * multiplier
  // Round UP to nearest Rp 500 for clean quotes
  const delivery_fee  = Math.ceil(rawTotal / 500) * 500
  const weight_surcharge = delivery_fee - Math.ceil(distanceFee / 500) * 500

  const courier_share  = Math.floor(delivery_fee * COURIER_SHARE)
  const platform_share = delivery_fee - courier_share

  return {
    distance_km:      Math.round(distanceKm * 100) / 100,
    base_fee:         BASE_FEE,
    weight_surcharge: Math.max(0, weight_surcharge),
    delivery_fee,
    courier_share,
    platform_share,
  }
}

/**
 * Quick display helper — returns formatted IDR string
 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style:    'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

/**
 * Validate a phone number is E.164 Indonesian format
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('62'))  return digits
  if (digits.startsWith('0'))   return '62' + digits.slice(1)
  if (digits.startsWith('+62')) return digits.slice(1)
  return digits  // return as-is, validation will catch format errors
}

export function isValidPhone(phone: string): boolean {
  return /^628\d{8,12}$/.test(phone)
}
