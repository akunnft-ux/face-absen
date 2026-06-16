"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User as AppUser } from "@/lib/types"

interface SessionUser {
  id: string
  email?: string
  created_at?: string
  user_metadata?: Record<string, unknown>
}

function sessionToAppUser(sessionUser: SessionUser): AppUser {
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

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    const supabase = supabaseRef.current
    let mounted = true

    async function updateFromSession(sessionUser: SessionUser) {
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", sessionUser.id)
        .single()

      if (profile && mounted) {
        setUser(profile as AppUser)
      } else if (mounted) {
        setUser(sessionToAppUser(sessionUser))
      }
    }

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      if (session?.user) {
        await updateFromSession(session.user)
      }

      setLoading(false)
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null)
      } else if (session?.user && mounted) {
        await updateFromSession(session.user)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = useCallback(async () => {
    const { logout } = await import("@/actions/auth")
    await logout()
  }, [])

  return { user, loading, signOut }
}
