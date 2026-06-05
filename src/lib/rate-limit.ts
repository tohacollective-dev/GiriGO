// =============================================================================
// In-memory rate limiter for API routes
//
// Tracks requests per key (IP, endpoint) within a sliding window.
// Returns { allowed: boolean, remaining: number, reset: number }
// =============================================================================

interface RateLimitEntry {
  count:    number
  resetAt:  number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup stale entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key)
    }
  }, 5 * 60_000)
}

export interface RateLimitConfig {
  windowMs:  number   // time window in milliseconds
  max:       number   // max requests per window
}

export interface RateLimitResult {
  allowed:    boolean
  remaining:  number
  reset:      number   // unix timestamp (seconds) when window resets
}

const defaultConfigs: Record<string, RateLimitConfig> = {
  tracking:  { windowMs: 60_000, max: 30 },    // 30 req/min for public tracking
  orders:    { windowMs: 60_000, max: 100 },    // 100 req/min for order operations
  webhook:   { windowMs: 60_000, max: 60 },     // 60 req/min for WhatsApp webhook
  auth:      { windowMs: 60_000, max: 10 },     // 10 req/min for auth endpoints
  geocode:   { windowMs: 60_000, max: 20 },     // 20 req/min for geocoding
  default:   { windowMs: 60_000, max: 200 },    // 200 req/min general
}

export function rateLimit(
  key: string,
  category: keyof typeof defaultConfigs = 'default',
): RateLimitResult {
  const config  = defaultConfigs[category] ?? defaultConfigs.default
  const now     = Date.now()
  const entry   = store.get(key)

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, remaining: config.max - 1, reset: Math.ceil((now + config.windowMs) / 1000) }
  }

  entry.count += 1
  const remaining = config.max - entry.count

  return {
    allowed:   remaining >= 0,
    remaining: Math.max(0, remaining),
    reset:     Math.ceil(entry.resetAt / 1000),
  }
}

// Helper: extract a rate-limit key from the request
export function getRateLimitKey(req: Request, suffix?: string): string {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  return suffix ? `${ip}:${suffix}` : ip
}

// Helper: apply rate limiting and return a 429 response if exceeded
export function applyRateLimit(
  req: Request,
  category: keyof typeof defaultConfigs = 'default',
): Response | null {
  const key    = getRateLimitKey(req, category)
  const result = rateLimit(key, category)

  if (!result.allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please slow down.' }),
      {
        status: 429,
        headers: {
          'Content-Type':  'application/json',
          'Retry-After':   String(result.reset - Math.ceil(Date.now() / 1000)),
          'X-RateLimit-Reset': String(result.reset),
        },
      },
    )
  }

  return null
}
