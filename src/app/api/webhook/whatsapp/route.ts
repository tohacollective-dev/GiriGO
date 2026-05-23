// =============================================================================
// POST /api/webhook/whatsapp — Inbound WhatsApp message handler (Wati.io)
// GET  /api/webhook/whatsapp — Webhook verification
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { parseWatiPayload, verifyWebhookToken } from '@/lib/whatsapp'
import { handleInboundMessage } from '@/lib/bot'

// Webhook verification (META / Wati.io challenge)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && verifyWebhookToken(token ?? '')) {
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

// Inbound message handler
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Verify token from Wati header (optional, depends on Wati plan)
    const headerToken = req.headers.get('x-wati-token')
    if (headerToken && !verifyWebhookToken(headerToken)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
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
