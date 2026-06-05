import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from './supabase'
import type { Courier } from '@/types'

// =============================================================================
// API route authentication helpers
//
// requireAuth    — validates session, returns user (for admin endpoints)
// requireCourier — validates session + courier profile (for courier endpoints)
// =============================================================================

export interface AuthResult {
  user: {
    id:    string
    email: string
    role:  string
  }
}

export interface CourierAuthResult {
  courier: Courier
  user:    AuthResult['user']
}

function createAuthClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(_name: string, _value: string, _options: any) {},
        remove(_name: string, _options: any) {},
      },
    },
  )
}

export async function authenticateRequest(
  req: NextRequest,
): Promise<{ user: AuthResult['user']; response: NextResponse } | null> {
  const supabase = createAuthClient(req)

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

// ── Courier auth ─────────────────────────────────────────────────────────────

export async function requireCourierAuth(
  req: NextRequest,
): Promise<CourierAuthResult | Response> {
  const authUser = await authenticateRequest(req)
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized — please sign in' }, { status: 401 })
  }

  const { data: courier, error } = await supabaseAdmin
    .from('couriers')
    .select('*')
    .eq('auth_id', authUser.user.id)
    .single()

  if (error || !courier) {
    return NextResponse.json(
      { error: 'Courier profile not found. Contact admin to link your account.' },
      { status: 403 },
    )
  }

  return { courier: courier as Courier, user: authUser.user }
}
