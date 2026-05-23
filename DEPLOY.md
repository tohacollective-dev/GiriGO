# GiriGo Courier — Deployment Guide

## Prerequisites

- Node.js 18+
- Supabase project (free tier)
- Vercel account (free tier)
- Google Cloud project with Maps API enabled
- WhatsApp Business API via Wati.io

---

## 1. Supabase Setup

1. Create a new project at https://supabase.com
2. Go to **SQL Editor** and run:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Copy your credentials from **Project Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Google Maps API

1. Go to https://console.cloud.google.com
2. Enable these APIs:
   - Geocoding API
   - Distance Matrix API
3. Create an API key, restrict it to your Vercel domain
4. Set `GOOGLE_MAPS_API_KEY` and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

---

## 3. WhatsApp (Wati.io)

1. Sign up at https://wati.io (free trial available)
2. Connect your WhatsApp Business number
3. Go to **API → Access Token** and copy your token
4. Set the webhook URL to: `https://YOUR_DOMAIN/api/webhook/whatsapp`
5. Set `WHATSAPP_API_URL`, `WHATSAPP_API_TOKEN`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

---

## 4. Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# From project root
cd girigocourier
vercel

# Add all environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add GOOGLE_MAPS_API_KEY
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
vercel env add WHATSAPP_API_URL
vercel env add WHATSAPP_API_TOKEN
vercel env add WHATSAPP_WEBHOOK_VERIFY_TOKEN
vercel env add WHATSAPP_PHONE_NUMBER_ID
vercel env add ADMIN_WHATSAPP_NUMBER
vercel env add ADMIN_SECRET
vercel env add NEXT_PUBLIC_APP_URL

# Deploy to production
vercel --prod
```

---

## 5. Post-Deployment Checklist

- [ ] Supabase migration SQL executed successfully
- [ ] Test webhook: `curl https://YOUR_DOMAIN/api/webhook/whatsapp?hub.verify_token=YOUR_TOKEN`
- [ ] Register first courier via admin panel at `/admin/couriers`
- [ ] Send test WhatsApp "Halo" to your business number — confirm bot responds
- [ ] Create test order through bot flow
- [ ] Verify dispatch engine assigns to courier
- [ ] Test tracking page at `/tracking/GG-YYMMDD-001`
- [ ] Confirm ledger entry created on delivery
- [ ] Check admin dashboard shows data

---

## 6. Short URLs (Optional)

Set up a custom short domain for tracking links:
- `girigo.id/t/GG-YYMMDD-001` → `https://YOUR_DOMAIN/tracking/GG-YYMMDD-001`

Configure in Vercel Dashboard → Domains, or use Cloudflare Workers for free redirect.

---

## 7. Make.com / n8n Integration (WhatsApp Automation Layer)

If using Make.com instead of the built-in bot:
1. Create a new scenario: **WhatsApp (Wati) → HTTP → Supabase**
2. Webhook trigger: inbound messages from Wati
3. HTTP module: POST to `https://YOUR_DOMAIN/api/webhook/whatsapp`
4. Pass full Wati payload as body

---

## 8. Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role (server-only) |
| `GOOGLE_MAPS_API_KEY` | ⚡ | Server-side Maps key (geocoding + distance) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | ⚡ | Client-side Maps key (nav links) |
| `WHATSAPP_API_URL` | ✅ | Wati.io base URL |
| `WHATSAPP_API_TOKEN` | ✅ | Wati.io access token |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | ✅ | Your chosen verify token |
| `WHATSAPP_PHONE_NUMBER_ID` | ✅ | WhatsApp Business phone ID |
| `ADMIN_WHATSAPP_NUMBER` | ✅ | Admin's WhatsApp number (628xxx) |
| `ADMIN_SECRET` | ✅ | Secret header for admin API calls |
| `NEXT_PUBLIC_APP_URL` | ✅ | Full domain (https://your-domain.vercel.app) |
| `BASE_DELIVERY_FEE` | — | Default: 5000 (Rp5,000) |
| `PER_KM_RATE` | — | Default: 2000 (Rp2,000/km) |
| `COURIER_REVENUE_SHARE` | — | Default: 0.85 (85%) |
| `DISPATCH_TIMEOUT_SECONDS` | — | Default: 60 |
| `DISPATCH_MAX_ATTEMPTS` | — | Default: 3 |
| `DISPATCH_RADIUS_KM` | — | Default: 5 |

⚡ = fallback to haversine if not set (dev-friendly)

---

## 9. Key URLs After Deployment

| URL | Purpose |
|---|---|
| `/admin` | Admin dashboard |
| `/admin/orders` | Order management |
| `/admin/couriers` | Courier management |
| `/admin/analytics` | Revenue & performance |
| `/admin/exceptions` | Failed / stuck orders |
| `/admin/zones` | Coverage zones |
| `/courier` | Courier PWA (mobile) |
| `/tracking/[code]` | Public order tracking |
| `/api/webhook/whatsapp` | WhatsApp webhook endpoint |

---

*GiriGo Courier — Gerung, Lombok Barat*
