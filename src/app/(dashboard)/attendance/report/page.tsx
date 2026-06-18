"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/LoadingState"
import { getMonthlyRecap } from "@/actions/face-attendance"
import { Download } from "lucide-react"
import type { MonthlyRecap } from "@/lib/types"
import * as XLSX from "xlsx"

export default function ReportPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [data, setData] = useState<MonthlyRecap[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getMonthlyRecap(year, month)
      setData(result)
    } catch {
      setData([])
    }
    setLoading(false)
  }, [year, month])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const exportExcel = () => {
    const wb = XLSX.utils.book_new()
    const rows = data.map((r) => ({
      NIP: r.nip,
      Nama: r.nama_lengkap,
      Hadir: r.total_hadir,
      Terlambat: r.total_terlambat,
      Alpha: r.total_alpha,
      "Hari Kerja": r.total_hari_kerja,
      Persentase: `${r.persentase}%`,
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, "Rekap")
    XLSX.writeFile(wb, `rekap-absensi-${year}-${String(month).padStart(2, "0")}.xlsx`)
  }

  const monthName = new Date(year, month - 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Laporan</h1>
          <p className="text-sm text-muted-foreground">Rekap kehadiran pegawai</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportExcel} disabled={data.length === 0}>
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm flex-1"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2000, i).toLocaleDateString("id-ID", { month: "long" })}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm w-24"
        >
          {Array.from({ length: 4 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{monthName}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState />
          ) : data.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Belum ada data untuk periode ini
            </p>
          ) : (
            <div className="space-y-2">
              {data.map((r) => (
                <div
                  key={r.employee_id}
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{r.nama_lengkap}</p>
                    <p className="text-xs text-muted-foreground">{r.nip}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        H:{r.total_hadir} T:{r.total_terlambat}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        A:{r.total_alpha}
                      </p>
                    </div>
                    <Badge
                      variant={
                        r.persentase >= 80
                          ? "success"
                          : r.persentase >= 60
                          ? "warning"
                          : "destructive"
                      }
                      className="text-[10px]"
                    >
                      {r.persentase}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
