"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User as AppUser } from "@/lib/types"

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    const supabase = supabaseRef.current
    let mounted = true

    function buildUser(sessionUser: { id: string; email?: string; created_at?: string; user_metadata?: Record<string, unknown> }): AppUser {
      return {
        id: sessionUser.id,
        email: sessionUser.email ?? "",
        full_name: (sessionUser.user_metadata?.full_name as string) ?? "",
        role: (sessionUser.user_metadata?.role as AppUser["role"]) ?? "petugas",
        employee_id: null,
        created_at: sessionUser.created_at ?? new Date().toISOString(),
        updated_at: sessionUser.created_at ?? new Date().toISOString(),
      }
    }

    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      if (session?.user) setUser(buildUser(session.user))
      setLoading(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null)
      } else if (session?.user && mounted) {
        setUser(buildUser(session.user))
      }
      setLoading(false)
    })

    return () => { mounted = false; subscription.unsubscribe() }
  }, [])

  const signOut = useCallback(async () => {
    const supabase = supabaseRef.current
    await supabase.auth.signOut()
    window.location.href = "/login"
  }, [])

  return { user, loading, signOut }
}