// =============================================================================
// POST /api/dispatch — Trigger dispatch engine for an order
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { dispatchOrder } from '@/lib/dispatch'
import { authenticateRequest } from '@/lib/api-auth'

const schema = z.object({
  order_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  // Auth: accept either session cookie (admin UI) or shared secret (bot/internal)
  const authResult = await authenticateRequest(req)
  const secret      = req.headers.get('x-admin-secret')

  if (!authResult && secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body   = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'order_id required (UUID)' }, { status: 422 })
    }

    // Fire dispatch asynchronously — Vercel free tier allows up to 10s
    dispatchOrder(parsed.data.order_id).catch(err =>
      console.error('[Dispatch] Error:', err)
    )

    return NextResponse.json({ ok: true, message: 'Dispatch initiated' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
