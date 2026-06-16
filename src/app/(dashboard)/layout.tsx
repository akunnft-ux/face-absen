"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import type { Role } from "@/lib/types"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<{
    id: string
    email: string
    full_name: string
    role: Role
    employee_id: string | null
    created_at: string
    updated_at: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      if (u) {
        setSession({
          id: u.id,
          email: u.email ?? "",
          full_name: (u.user_metadata?.full_name as string) ?? "",
          role: (u.user_metadata?.role as Role) ?? "petugas",
          employee_id: null,
          created_at: u.created_at ?? new Date().toISOString(),
          updated_at: u.created_at ?? new Date().toISOString(),
        })
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user
      if (u) {
        setSession({
          id: u.id,
          email: u.email ?? "",
          full_name: (u.user_metadata?.full_name as string) ?? "",
          role: (u.user_metadata?.role as Role) ?? "petugas",
          employee_id: null,
          created_at: u.created_at ?? new Date().toISOString(),
          updated_at: u.created_at ?? new Date().toISOString(),
        })
      } else {
        setSession(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        role={session.role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col lg:ml-64">
        <Header
          user={session}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={async () => {
            const supabase = createClient()
            await supabase.auth.signOut()
            window.location.href = "/login"
          }}
        />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
