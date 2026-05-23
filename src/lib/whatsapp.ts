// =============================================================================
// GiriGo — WhatsApp API Client (Wati.io / Meta Cloud API compatible)
// =============================================================================

const WA_URL     = process.env.WHATSAPP_API_URL!
const WA_TOKEN   = process.env.WHATSAPP_API_TOKEN!

/**
 * Send a plain-text WhatsApp message to a phone number.
 * phone: E.164 format (628xxxxxxxxx)
 */
export async function sendWhatsApp(phone: string, message: string): Promise<void> {
  if (!WA_URL || !WA_TOKEN) {
    console.warn('[WhatsApp] API not configured — logging message instead:')
    console.log(`TO: ${phone}\n${message}\n---`)
    return
  }

  // Wati.io format
  const payload = {
    whatsappNumber: phone,
    messageText:    message,
  }

  const res = await fetch(`${WA_URL}/sendSessionMessage/${phone}`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${WA_TOKEN}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`WhatsApp send failed [${res.status}]: ${body}`)
  }
}

/**
 * Verify incoming Wati.io webhook signature
 * Returns true if valid, false if tampered
 */
export function verifyWebhookToken(token: string): boolean {
  return token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
}

/**
 * Parse Wati.io inbound webhook payload into normalized message
 */
export function parseWatiPayload(body: Record<string, unknown>) {
  // Wati.io sends: { waId, text: { body }, timestamp, id }
  const waId      = body.waId        as string | undefined
  const textBody  = (body.text as any)?.body as string | undefined
  const timestamp = body.timestamp   as string | undefined
  const msgId     = body.id          as string | undefined
  const type      = (body.type       as string | undefined) ?? 'text'
  const mediaUrl  = (body.media as any)?.url as string | undefined

  if (!waId || !msgId) return null

  return {
    from:       waId,
    body:       textBody?.trim() ?? '',
    timestamp:  timestamp ?? new Date().toISOString(),
    message_id: msgId,
    type:       type as 'text' | 'image' | 'audio' | 'document',
    media_url:  mediaUrl,
  }
}
