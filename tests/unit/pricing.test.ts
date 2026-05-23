import { calculatePrice, formatIDR, normalizePhone, isValidPhone } from '@/lib/pricing'

describe('calculatePrice', () => {
  it('charges base fee for distance ≤ 2km', () => {
    const result = calculatePrice(1.0)
    expect(result.base_fee).toBe(5000)
    expect(result.delivery_fee).toBe(5000)
    expect(result.courier_share).toBe(4250)
    expect(result.platform_share).toBe(750)
  })

  it('adds per-km rate for distance > 2km', () => {
    // 3km: base 5000 + 1km * 2000 = 7000 → rounded to nearest 500 = 7000
    const result = calculatePrice(3)
    expect(result.delivery_fee).toBe(7000)
  })

  it('rounds up to nearest Rp500', () => {
    // 2.3km: 5000 + 0.3*2000 = 5600 → rounds up to 6000
    const result = calculatePrice(2.3)
    expect(result.delivery_fee).toBe(6000)
  })

  it('applies weight surcharge for medium package (3-5kg)', () => {
    const light  = calculatePrice(3, 1.0)
    const medium = calculatePrice(3, 4.0)
    expect(medium.delivery_fee).toBeGreaterThan(light.delivery_fee)
    expect(medium.weight_surcharge).toBeGreaterThan(0)
  })

  it('applies weight surcharge for heavy package (>5kg)', () => {
    const heavy = calculatePrice(3, 6.0)
    expect(heavy.weight_surcharge).toBeGreaterThan(0)
    // heavy multiplier 1.4 vs medium 1.2
    const medium = calculatePrice(3, 4.0)
    expect(heavy.delivery_fee).toBeGreaterThan(medium.delivery_fee)
  })

  it('always returns 85/15 split', () => {
    const result = calculatePrice(5)
    const total = result.courier_share + result.platform_share
    expect(total).toBe(result.delivery_fee)
    expect(result.courier_share).toBe(Math.round(result.delivery_fee * 0.85))
  })

  it('handles zero km (pickup = dropoff edge case)', () => {
    const result = calculatePrice(0)
    expect(result.delivery_fee).toBe(5000)
  })

  it('handles large distances correctly', () => {
    // 15km: 5000 + 13*2000 = 31000 → already multiple of 500
    const result = calculatePrice(15)
    expect(result.delivery_fee).toBe(31000)
    expect(result.distance_km).toBe(15)
  })
})

describe('formatIDR', () => {
  it('formats zero', () => {
    expect(formatIDR(0)).toContain('0')
  })

  it('formats Rp5000 correctly', () => {
    const formatted = formatIDR(5000)
    expect(formatted).toMatch(/5[.,]000/)
  })

  it('formats large amounts', () => {
    const formatted = formatIDR(1500000)
    expect(formatted).toMatch(/1[.,]500[.,]000/)
  })
})

describe('normalizePhone', () => {
  it('converts 08xx to 628xx', () => {
    expect(normalizePhone('081234567890')).toBe('6281234567890')
  })

  it('converts +628xx to 628xx', () => {
    expect(normalizePhone('+6281234567890')).toBe('6281234567890')
  })

  it('leaves 628xx unchanged', () => {
    expect(normalizePhone('6281234567890')).toBe('6281234567890')
  })

  it('strips spaces and dashes', () => {
    expect(normalizePhone('0812-3456-7890')).toBe('6281234567890')
  })
})

describe('isValidPhone', () => {
  it('accepts valid Indonesian mobile number', () => {
    expect(isValidPhone('6281234567890')).toBe(true)
  })

  it('rejects non-628 prefix', () => {
    expect(isValidPhone('1234567890')).toBe(false)
  })

  it('rejects too-short numbers', () => {
    expect(isValidPhone('6281234')).toBe(false)
  })

  it('rejects non-digit characters', () => {
    expect(isValidPhone('628abc123')).toBe(false)
  })
})
