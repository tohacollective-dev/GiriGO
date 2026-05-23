import { haversineKm, parseGeo, generateNavLink } from '@/lib/maps'

describe('haversineKm', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineKm(-8.6505, 116.1205, -8.6505, 116.1205)).toBe(0)
  })

  it('calculates distance between two Gerung landmarks', () => {
    // Giri Menang Square → Gerung Pasar (approx 1.5km)
    const giriMenangSquare = { lat: -8.6505, lng: 116.1205 }
    const gerungPasar      = { lat: -8.6620, lng: 116.1280 }
    const dist = haversineKm(giriMenangSquare.lat, giriMenangSquare.lng, gerungPasar.lat, gerungPasar.lng)
    expect(dist).toBeGreaterThan(1.0)
    expect(dist).toBeLessThan(3.0)
  })

  it('is symmetric (A→B == B→A)', () => {
    const d1 = haversineKm(-8.65, 116.12, -8.70, 116.15)
    const d2 = haversineKm(-8.70, 116.15, -8.65, 116.12)
    expect(Math.abs(d1 - d2)).toBeLessThan(0.001)
  })

  it('returns positive value for distinct points', () => {
    const dist = haversineKm(-8.6, 116.1, -8.7, 116.2)
    expect(dist).toBeGreaterThan(0)
  })

  it('calculates roughly correct distance (Jakarta–Lombok ~1060km)', () => {
    const jakartaLat = -6.2, jakartaLng = 106.8
    const lombokLat  = -8.6, lombokLng  = 116.1
    const dist = haversineKm(jakartaLat, jakartaLng, lombokLat, lombokLng)
    // Haversine straight-line distance is ~1059km (not road distance)
    expect(dist).toBeGreaterThan(900)
    expect(dist).toBeLessThan(1200)
  })
})

describe('parseGeo', () => {
  it('parses valid lat,lng string', () => {
    const result = parseGeo('-8.6505,116.1205')
    expect(result).not.toBeNull()
    expect(result!.lat).toBeCloseTo(-8.6505)
    expect(result!.lng).toBeCloseTo(116.1205)
  })

  it('returns null for empty string', () => {
    expect(parseGeo('')).toBeNull()
  })

  it('returns null for invalid format', () => {
    expect(parseGeo('not,a,valid,geo')).toBeNull()
  })

  it('returns null for NaN values', () => {
    expect(parseGeo('abc,def')).toBeNull()
  })

  it('handles whitespace around values', () => {
    const result = parseGeo(' -8.6505 , 116.1205 ')
    expect(result).not.toBeNull()
    expect(result!.lat).toBeCloseTo(-8.6505)
  })
})

describe('generateNavLink', () => {
  it('returns a valid Google Maps URL', () => {
    const url = generateNavLink(-8.6505, 116.1205)
    expect(url).toContain('google.com/maps')
    expect(url).toContain('-8.6505')
    expect(url).toContain('116.1205')
  })

  it('includes destination parameter', () => {
    const url = generateNavLink(-8.65, 116.12)
    expect(url).toContain('destination=')
  })
})
