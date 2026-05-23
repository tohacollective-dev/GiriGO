import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL     ?? 'http://localhost:54321'
const supabaseAnon    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY     ?? supabaseAnon

// Public client — uses anon key (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnon)

// Server-side admin client — bypasses RLS (server only, never expose to client)
export const supabaseAdmin = createClient(supabaseUrl, supabaseService, {
  auth: { autoRefreshToken: false, persistSession: false },
})
