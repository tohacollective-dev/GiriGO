import { createSupabaseBrowserClient } from './supabase-browser'
import type { AdminUser } from '@/types/auth'

export async function signIn(email: string, password: string) {
  const supabase = createSupabaseBrowserClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const supabase = createSupabaseBrowserClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function signInWithGoogle() {
  const supabase = createSupabaseBrowserClient()
  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/admin`
      : `${process.env.NEXT_PUBLIC_APP_URL}/admin`
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })
  if (error) throw error
  return data
}

export async function resetPassword(email: string) {
  const supabase = createSupabaseBrowserClient()
  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/admin/reset-password`
      : `${process.env.NEXT_PUBLIC_APP_URL}/admin/reset-password`
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  if (error) throw error
}

export async function getSession() {
  const supabase = createSupabaseBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = createSupabaseBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return {
    id:         user.id,
    email:      user.email!,
    name:       user.user_metadata?.name ?? user.email!.split('@')[0],
    role:       user.user_metadata?.role ?? 'operator',
    avatar_url: user.user_metadata?.avatar_url,
    last_login: user.last_sign_in_at,
  }
}
