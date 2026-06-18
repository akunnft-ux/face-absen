"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/shared/LoadingState"
import { Users, Camera, CheckCircle, XCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

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

  const statItems = [
    { title: "Total Pegawai", value: stats.totalPegawai, icon: Users, color: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" },
    { title: "Terdaftar Wajah", value: stats.terdaftarWajah, icon: Camera, color: "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400" },
    { title: "Absen Hari Ini", value: stats.absensiHariIni, icon: CheckCircle, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" },
    { title: "Belum Absen", value: stats.belumAbsen, icon: XCircle, color: "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Ringkasan absensi hari ini</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {statItems.map((item) => (
          <Card key={item.title} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{item.title}</p>
                  <p className="text-2xl font-bold">{item.value}</p>
                </div>
                <div className={`rounded-xl p-3 ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Link href="/attendance">
            <Button className="w-full h-12 text-base justify-start gap-3" size="lg">
              <Camera className="h-5 w-5" />
              Absen Wajah Sekarang
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
          </Link>
          <Link href="/employees">
            <Button variant="outline" className="w-full h-12 text-base justify-start gap-3" size="lg">
              <Users className="h-5 w-5" />
              Kelola Pegawai
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <RecentActivity />
    </div>
  )
}

function RecentActivity() {
  const supabase = createClient()
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    supabase
      .from("face_attendance")
      .select("*, employee:employees(nama_lengkap, nip)")
      .gte("check_in_at", today.toISOString())
      .order("check_in_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setActivities(data)
        setLoading(false)
      })
  }, [supabase])

  if (loading || activities.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Aktivitas Terbaru</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.map((a: any) => (
          <div
            key={a.id}
            className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{a.employee?.nama_lengkap}</p>
                <p className="text-xs text-muted-foreground">{a.employee?.nip}</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(a.check_in_at).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
