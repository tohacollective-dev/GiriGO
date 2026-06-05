// =============================================================================
// POST /api/webhook/whatsapp — Inbound WhatsApp message handler (Wati.io)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { parseWatiPayload, verifyWebhookToken } from '@/lib/whatsapp'
import { handleInboundMessage } from '@/lib/bot'
import { applyRateLimit } from '@/lib/rate-limit'

// Health-check / Wati.io webhook verification
export async function GET() {
  return new NextResponse('OK', { status: 200 })
}

// Inbound message handler
export async function POST(req: NextRequest) {
  const limited = applyRateLimit(req, 'webhook')
  if (limited) return limited
  try {
    const body = await req.json()

    // Verify Wati.io webhook token (required)
    const token = body.token as string | undefined
    if (!token || !verifyWebhookToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const msg = parseWatiPayload(body)
    if (!msg) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    // Process message asynchronously (don't block the webhook response)
    handleInboundMessage(msg).catch(err =>
      console.error('[Bot] Error processing message:', err)
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Webhook] Parse error:', err)
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
