#!/usr/bin/env bash
# GiriGo Courier — Vercel Environment Variable Setup
# Run this script AFTER filling in your real values below.
# Usage: bash setup-env.sh

set -e

# ── Fill these in before running ──────────────────────────────────────────────
SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

GOOGLE_MAPS_API_KEY="your-server-side-maps-key"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-client-side-maps-key"

WHATSAPP_API_URL="https://live-server.wati.io/api/v1"
WHATSAPP_API_TOKEN="your-wati-bearer-token"
WHATSAPP_WEBHOOK_VERIFY_TOKEN="your-random-32char-verify-token"
WHATSAPP_PHONE_NUMBER_ID="your-meta-phone-number-id"

ADMIN_WHATSAPP_NUMBER="628xxxxxxxxxx"
ADMIN_SECRET="your-strong-random-admin-secret"
# ─────────────────────────────────────────────────────────────────────────────

printf '%s\n' "$SUPABASE_URL"              | vercel env add NEXT_PUBLIC_SUPABASE_URL       production
printf '%s\n' "$SUPABASE_ANON_KEY"         | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY  production
printf '%s\n' "$SUPABASE_SERVICE_ROLE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY       production

printf '%s\n' "$GOOGLE_MAPS_API_KEY"            | vercel env add GOOGLE_MAPS_API_KEY            production
printf '%s\n' "$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" | vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production

printf '%s\n' "$WHATSAPP_API_URL"              | vercel env add WHATSAPP_API_URL              production
printf '%s\n' "$WHATSAPP_API_TOKEN"            | vercel env add WHATSAPP_API_TOKEN            production
printf '%s\n' "$WHATSAPP_WEBHOOK_VERIFY_TOKEN" | vercel env add WHATSAPP_WEBHOOK_VERIFY_TOKEN production
printf '%s\n' "$WHATSAPP_PHONE_NUMBER_ID"      | vercel env add WHATSAPP_PHONE_NUMBER_ID      production

printf '%s\n' "$ADMIN_WHATSAPP_NUMBER" | vercel env add ADMIN_WHATSAPP_NUMBER production
printf '%s\n' "$ADMIN_SECRET"          | vercel env add ADMIN_SECRET          production

echo ""
echo "✅ All environment variables added to Vercel production."
echo "   Run: vercel --prod   to redeploy with live credentials."
