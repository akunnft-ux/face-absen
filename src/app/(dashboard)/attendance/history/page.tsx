"use client"
export const dynamic = "force-dynamic"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { Badge } from "@/components/ui/badge"

interface AttendanceWithEmployee {
  id: string
  employee_id: string
  check_in_at: string
  match_confidence: number
  liveness_passed: boolean
  employee: { nama_lengkap: string; nip: string }
}

export default function HistoryPage() {
  const supabase = createClient()
  const [data, setData] = useState<AttendanceWithEmployee[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  const fetchHistory = useCallback(async () => {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    const { data: result } = await supabase
      .from("face_attendance")
      .select("*, employee:employees(nama_lengkap, nip)")
      .gte("check_in_at", start.toISOString())
      .lte("check_in_at", end.toISOString())
      .order("check_in_at", { ascending: false })

    if (result) setData(result as AttendanceWithEmployee[])
    setLoading(false)
  }, [supabase, date])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const columns: Column<AttendanceWithEmployee>[] = [
    {
      key: "employee",
      header: "Pegawai",
      render: (a) => (
        <div>
          <p className="font-medium">{a.employee?.nama_lengkap}</p>
          <p className="text-xs text-muted-foreground">{a.employee?.nip}</p>
        </div>
      ),
    },
    {
      key: "check_in_at",
      header: "Waktu Absen",
      render: (a) => (
        <span className="text-sm">
          {new Date(a.check_in_at).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
      ),
    },
    {
      key: "match_confidence",
      header: "Kecocokan",
      render: (a) => (
        <Badge variant={a.match_confidence > 0.65 ? "success" : "warning"}>
          {Math.round(a.match_confidence * 100)}%
        </Badge>
      ),
    },
    {
      key: "liveness_passed",
      header: "Liveness",
      render: (a) =>
        a.liveness_passed ? (
          <Badge variant="success">Lolos</Badge>
        ) : (
          <Badge variant="destructive">Gagal</Badge>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Riwayat Absensi</h1>
          <p className="text-sm text-muted-foreground">
            Data absensi face recognition
          </p>
        </div>
        <Input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            setLoading(true)
          }}
          className="w-48"
        />
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        searchable={false}
        emptyTitle="Belum ada data absensi"
        emptyDescription="Pegawai belum melakukan absen pada tanggal ini"
        getKey={(a) => a.id}
      />
    </div>
  )
}
