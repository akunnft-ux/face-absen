"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { Role } from "@/lib/types"
import { Camera, History, Users, LayoutDashboard, BarChart3, UserCog } from "lucide-react"

const tabs = [
  { href: "/attendance", label: "Absen", icon: Camera, roles: ["super_admin", "admin", "petugas"] },
  { href: "/attendance/history", label: "Riwayat", icon: History, roles: ["super_admin", "admin", "petugas"] },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "admin"] },
  { href: "/employees", label: "Pegawai", icon: Users, roles: ["super_admin", "admin"] },
  { href: "/attendance/report", label: "Laporan", icon: BarChart3, roles: ["super_admin", "admin"] },
  { href: "/settings", label: "Akun", icon: UserCog, roles: ["super_admin", "admin", "petugas"] },
]

export function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname()
  const filteredTabs = tabs.filter((t) => t.roles.includes(role))

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card lg:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {filteredTabs.slice(0, 5).map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + "/")
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className={cn("h-5 w-5", isActive && "fill-primary/10")} />
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
