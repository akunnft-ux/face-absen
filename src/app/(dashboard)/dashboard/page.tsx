"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { StatCard } from "@/components/shared/StatCard"
import { LoadingState } from "@/components/shared/LoadingState"
import { Users, Camera, CheckCircle, XCircle, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  const supabase = createClient()
  const [stats, setStats] = useState({
    totalPegawai: 0,
    terdaftarWajah: 0,
    absensiHariIni: 0,
    belumAbsen: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count: totalPegawai } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("status_aktif", true)

    const { count: terdaftarWajah } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("status_aktif", true)
      .eq("is_terdaftar_wajah", true)

    const { count: absensiHariIni } = await supabase
      .from("face_attendance")
      .select("*", { count: "exact", head: true })
      .gte("check_in_at", today.toISOString())

    setStats({
      totalPegawai: totalPegawai || 0,
      terdaftarWajah: terdaftarWajah || 0,
      absensiHariIni: absensiHariIni || 0,
      belumAbsen: (totalPegawai || 0) - (absensiHariIni || 0),
    })
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (loading) return <LoadingState />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Ringkasan absensi hari ini</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Pegawai Aktif"
          value={stats.totalPegawai}
          icon={Users}
        />
        <StatCard
          title="Terdaftar Wajah"
          value={stats.terdaftarWajah}
          icon={Camera}
          trend={
            stats.totalPegawai > 0
              ? {
                  value: Math.round((stats.terdaftarWajah / stats.totalPegawai) * 100),
                  positive: true,
                }
              : undefined
          }
        />
        <StatCard
          title="Absen Hari Ini"
          value={stats.absensiHariIni}
          icon={CheckCircle}
        />
        <StatCard
          title="Belum Absen"
          value={stats.belumAbsen}
          icon={XCircle}
          trend={
            stats.belumAbsen > 0
              ? { value: Math.round((stats.belumAbsen / stats.totalPegawai) * 100), positive: false }
              : undefined
          }
        />
      </div>
    </div>
  )
}
