"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTable, type Column } from "@/components/shared/DataTable"
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

  const columns: Column<MonthlyRecap>[] = [
    { key: "nip", header: "NIP", render: (r) => <span className="font-mono text-xs">{r.nip}</span> },
    { key: "nama", header: "Nama", render: (r) => <span className="font-medium">{r.nama_lengkap}</span> },
    { key: "hadir", header: "Hadir", render: (r) => <Badge variant="success">{r.total_hadir}</Badge> },
    { key: "terlambat", header: "Terlambat", render: (r) => <Badge variant="warning">{r.total_terlambat}</Badge> },
    { key: "alpha", header: "Alpha", render: (r) => <Badge variant={r.total_alpha > 0 ? "destructive" : "outline"}>{r.total_alpha}</Badge> },
    {
      key: "persentase",
      header: "Persentase",
      render: (r) => (
        <Badge variant={r.persentase >= 80 ? "success" : r.persentase >= 60 ? "warning" : "destructive"}>
          {r.persentase}%
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Laporan Absensi</h1>
          <p className="text-sm text-muted-foreground">
            Rekap kehadiran pegawai per bulan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="month"
            value={`${year}-${String(month).padStart(2, "0")}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split("-")
              setYear(Number(y))
              setMonth(Number(m))
            }}
            className="w-48"
          />
          <Button variant="outline" onClick={exportExcel} disabled={data.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Rekap Bulanan — {new Date(year, month - 1).toLocaleDateString("id-ID", {
              month: "long",
              year: "numeric",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data}
            loading={loading}
            searchable={false}
            emptyTitle="Belum ada data"
            emptyDescription="Data rekap akan muncul setelah ada pegawai yang absen"
            getKey={(r) => r.employee_id}
          />
        </CardContent>
      </Card>
    </div>
  )
}
