'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { getAdminUser, signOut as authSignOut } from '@/lib/auth'
import type { AdminUser } from '@/types/auth'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser]       = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router                = useRouter()

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session) setUser(await getAdminUser())
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        if (session) {
          setUser(await getAdminUser())
        } else {
          setUser(null)
        }
        if (event === 'SIGNED_OUT') {
          router.push('/admin/login')
          router.refresh()
        }
      },
    )

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signOut = useCallback(async () => {
    await authSignOut()
  }, [])

  return { session, user, loading, signOut }
}
