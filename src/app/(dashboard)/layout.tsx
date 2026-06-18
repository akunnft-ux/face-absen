"use client"

import { useAuth } from "@/hooks/useAuth"
import { Sidebar } from "@/components/layout/Sidebar"
import { MobileNav } from "@/components/layout/MobileNav"
import { Header } from "@/components/layout/Header"
import { useState } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <Sidebar
        role={user.role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col pb-16 lg:pb-0 lg:ml-64">
        <Header
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={signOut}
        />
        <main className="flex-1 px-4 py-4 md:px-6 md:py-6 max-w-4xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav role={user.role} />
    </div>
  )
}
