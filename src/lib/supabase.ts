import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnon    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate required env vars at module init
if (!supabaseAnon || supabaseAnon === 'placeholder-anon-key') {
  throw new Error(
    '[GiriGo] NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured. ' +
    'Copy .env.example to .env and fill in your Supabase credentials.',
  )
}

const effectiveUrl = supabaseUrl || 'http://localhost:54321'

// Public client — uses anon key (respects RLS)
export const supabase = createClient(effectiveUrl, supabaseAnon)

// Server-side admin client — bypasses RLS (server only, never expose to client)
// Throws a clear error if SUPABASE_SERVICE_ROLE_KEY is missing (instead of
// silently falling back to the anon key as the previous code did).
if (!supabaseService) {
  throw new Error(
    '[GiriGo] SUPABASE_SERVICE_ROLE_KEY is not configured. ' +
    'The supabaseAdmin client requires a service role key for server-side operations. ' +
    'Set SUPABASE_SERVICE_ROLE_KEY in your .env file.',
  )
}

export const supabaseAdmin = createClient(effectiveUrl, supabaseService, {
  auth: { autoRefreshToken: false, persistSession: false },
})
