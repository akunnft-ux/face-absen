"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { createEmployee, updateEmployee, toggleEmployeeStatus } from "@/actions/employees"
import { Plus, Pencil, Camera, Power, PowerOff } from "lucide-react"
import type { Employee } from "@/lib/types"

export default function EmployeesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchEmployees = useCallback(async () => {
    let query = supabase.from("employees").select("*").order("created_at", { ascending: false })

    if (search) {
      query = query.or(
        `nip.ilike.%${search}%,nama_lengkap.ilike.%${search}%,unit_kerja.ilike.%${search}%`
      )
    }

    const { data } = await query
    if (data) setEmployees(data)
    setLoading(false)
  }, [supabase, search])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = {
      nip: (form.nip as HTMLInputElement).value,
      nama_lengkap: (form.nama_lengkap as HTMLInputElement).value,
      jabatan: (form.jabatan as HTMLInputElement).value,
      unit_kerja: (form.unit_kerja as HTMLInputElement).value,
      email: (form.email as HTMLInputElement).value,
      nomor_hp: (form.nomor_hp as HTMLInputElement).value,
    }

    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, data)
      } else {
        await createEmployee(data)
      }
      setDialogOpen(false)
      setEditingEmployee(null)
      fetchEmployees()
    } catch (e) {
      alert(String(e))
    }
  }

  const handleToggleStatus = async (id: string, current: boolean) => {
    await toggleEmployeeStatus(id, !current)
    fetchEmployees()
  }

  const columns: Column<Employee>[] = [
    {
      key: "nip",
      header: "NIP",
      render: (e) => <span className="font-mono text-xs">{e.nip}</span>,
    },
    {
      key: "nama_lengkap",
      header: "Nama",
      render: (e) => (
        <div>
          <p className="font-medium">{e.nama_lengkap}</p>
          <p className="text-xs text-muted-foreground">{e.jabatan || "-"}</p>
        </div>
      ),
    },
    {
      key: "unit_kerja",
      header: "Unit Kerja",
      render: (e) => <span className="text-sm">{e.unit_kerja || "-"}</span>,
    },
    {
      key: "is_terdaftar_wajah",
      header: "Wajah",
      render: (e) =>
        e.is_terdaftar_wajah ? (
          <Badge variant="success">Terdaftar</Badge>
        ) : (
          <Badge variant="outline">Belum</Badge>
        ),
    },
    {
      key: "status_aktif",
      header: "Status",
      render: (e) =>
        e.status_aktif ? (
          <Badge variant="success">Aktif</Badge>
        ) : (
          <Badge variant="destructive">Nonaktif</Badge>
        ),
    },
    {
      key: "actions",
      header: "Aksi",
      render: (e) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingEmployee(e)
              setDialogOpen(true)
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/employees/${e.id}/register-face`)}
            disabled={!e.status_aktif}
          >
            <Camera className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleToggleStatus(e.id, e.status_aktif)}
          >
            {e.status_aktif ? (
              <PowerOff className="h-4 w-4 text-red-500" />
            ) : (
              <Power className="h-4 w-4 text-emerald-500" />
            )}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pegawai</h1>
          <p className="text-sm text-muted-foreground">
            {employees.length} pegawai terdaftar
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) setEditingEmployee(null)
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Pegawai
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? "Edit Pegawai" : "Tambah Pegawai"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nip">NIP *</Label>
                <Input
                  id="nip"
                  name="nip"
                  defaultValue={editingEmployee?.nip}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nama_lengkap">Nama Lengkap *</Label>
                <Input
                  id="nama_lengkap"
                  name="nama_lengkap"
                  defaultValue={editingEmployee?.nama_lengkap}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jabatan">Jabatan</Label>
                  <Input
                    id="jabatan"
                    name="jabatan"
                    defaultValue={editingEmployee?.jabatan || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_kerja">Unit Kerja</Label>
                  <Input
                    id="unit_kerja"
                    name="unit_kerja"
                    defaultValue={editingEmployee?.unit_kerja || ""}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={editingEmployee?.email || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nomor_hp">No. HP</Label>
                  <Input
                    id="nomor_hp"
                    name="nomor_hp"
                    defaultValue={editingEmployee?.nomor_hp || ""}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                {editingEmployee ? "Simpan" : "Tambah"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        columns={columns}
        data={employees}
        loading={loading}
        onSearch={setSearch}
        searchPlaceholder="Cari NIP, nama, atau unit kerja..."
        emptyTitle="Belum ada pegawai"
        emptyDescription="Tambahkan pegawai pertama untuk memulai"
        getKey={(e) => e.id}
      />
    </div>
  )
}
