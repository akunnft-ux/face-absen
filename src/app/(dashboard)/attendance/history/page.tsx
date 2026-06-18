"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/LoadingState"
import { EmptyState } from "@/components/shared/EmptyState"
import { CheckCircle, Clock, Calendar } from "lucide-react"

interface AttendanceRecord {
  id: string
  employee_id: string
  check_in_at: string
  match_confidence: number
  liveness_passed: boolean
  employee: { nama_lengkap: string; nip: string }
}

export default function HistoryPage() {
  const supabase = createClient()
  const [data, setData] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    supabase
      .from("face_attendance")
      .select("*, employee:employees(nama_lengkap, nip)")
      .gte("check_in_at", start.toISOString())
      .lte("check_in_at", end.toISOString())
      .order("check_in_at", { ascending: false })
      .then(({ data: result }) => {
        if (result) setData(result as AttendanceRecord[])
        setLoading(false)
      })
  }, [supabase, date])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Riwayat Absensi</h1>
          <p className="text-sm text-muted-foreground">
            {data.length} pegawai absen hari ini
          </p>
        </div>
      </div>

      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            setLoading(true)
          }}
          className="pl-10 h-12"
        />
      </div>

      {loading ? (
        <LoadingState />
      ) : data.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Belum ada data absensi"
          description="Pegawai belum melakukan absen pada tanggal ini"
        />
      ) : (
        <div className="space-y-2">
          {data.map((a) => (
            <Card key={a.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                      <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{a.employee?.nama_lengkap}</p>
                      <p className="text-xs text-muted-foreground">{a.employee?.nip}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {new Date(a.check_in_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <Badge variant={a.match_confidence > 0.65 ? "success" : "warning"} className="text-[10px]">
                      {Math.round(a.match_confidence * 100)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
