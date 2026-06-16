"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { Role } from "@/lib/types"
import {
  LayoutDashboard,
  Users,
  Camera,
  History,
  BarChart3,
  Settings,
  UserCog,
  X,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "admin"] },
  { href: "/attendance", label: "Absen Wajah", icon: Camera, roles: ["super_admin", "admin", "petugas"] },
  { href: "/attendance/history", label: "Riwayat Absensi", icon: History, roles: ["super_admin", "admin", "petugas"] },
  { href: "/attendance/report", label: "Laporan", icon: BarChart3, roles: ["super_admin", "admin"] },
  { href: "/employees", label: "Pegawai", icon: Users, roles: ["super_admin", "admin"] },
  { href: "/users", label: "Pengguna", icon: UserCog, roles: ["super_admin"] },
  { href: "/settings", label: "Pengaturan", icon: Settings, roles: ["super_admin", "admin", "petugas"] },
]

export function Sidebar({
  role,
  open,
  onClose,
}: {
  role: Role
  open: boolean
  onClose: () => void
}) {
  const pathname = usePathname()

  const filteredItems = navItems.filter((item) => item.roles.includes(role))

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 -translate-x-full border-r bg-card transition-transform duration-200 lg:translate-x-0",
          open && "translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link href="/dashboard" className="text-lg font-bold">
            Face-Absen
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="space-y-1 p-4">
          {filteredItems.map((item) => {
            const isActive = item.href === "/attendance"
              ? pathname === "/attendance"
              : pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
