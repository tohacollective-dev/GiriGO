import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// =============================================================================
// API route authentication helper
//
// Verifies the user has a valid Supabase session via cookies.
// Returns the authenticated user, or responds with 401 and null.
// =============================================================================

export interface AuthResult {
  user: {
    id:    string
    email: string
    role:  string
  }
}

export async function authenticateRequest(
  req: NextRequest,
): Promise<{ user: AuthResult['user']; response: NextResponse } | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // No-op for read-only auth check
        },
        remove(name: string, options: any) {
          // No-op for read-only auth check
        },
      },
    },
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user || !user.email) return null

  const role = (user.user_metadata?.role ?? user.app_metadata?.role ?? 'operator') as string

  return {
    user: {
      id:    user.id,
      email: user.email,
      role,
    },
    response: NextResponse.next(),
  }
}

// Convenience wrapper: returns 401 JSON if not authenticated, or the user
export async function requireAuth(req: NextRequest): Promise<AuthResult['user'] | Response> {
  const result = await authenticateRequest(req)
  if (!result) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return result.user
}
