"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createEmployee, updateEmployee, toggleEmployeeStatus } from "@/actions/employees"
import { LoadingState } from "@/components/shared/LoadingState"
import { Plus, Pencil, Camera, Power, PowerOff, Search, Users, ScanFace } from "lucide-react"
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
    const form = new FormData(e.currentTarget)
    const data = {
      nip: form.get("nip") as string,
      nama_lengkap: form.get("nama_lengkap") as string,
      jabatan: form.get("jabatan") as string,
      unit_kerja: form.get("unit_kerja") as string,
      email: form.get("email") as string,
      nomor_hp: form.get("nomor_hp") as string,
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

  const terdaftar = employees.filter((e) => e.is_terdaftar_wajah).length

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Pegawai</h1>
          <p className="text-sm text-muted-foreground">
            {employees.length} pegawai · {terdaftar} terdaftar wajah
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
            <Button size="icon" className="h-10 w-10 rounded-full">
              <Plus className="h-5 w-5" />
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
                <Input id="nip" name="nip" defaultValue={editingEmployee?.nip} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nama_lengkap">Nama Lengkap *</Label>
                <Input id="nama_lengkap" name="nama_lengkap" defaultValue={editingEmployee?.nama_lengkap} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="jabatan">Jabatan</Label>
                  <Input id="jabatan" name="jabatan" defaultValue={editingEmployee?.jabatan || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_kerja">Unit Kerja</Label>
                  <Input id="unit_kerja" name="unit_kerja" defaultValue={editingEmployee?.unit_kerja || ""} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={editingEmployee?.email || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nomor_hp">No. HP</Label>
                  <Input id="nomor_hp" name="nomor_hp" defaultValue={editingEmployee?.nomor_hp || ""} />
                </div>
              </div>
              <Button type="submit" className="w-full h-12">
                {editingEmployee ? "Simpan" : "Tambah"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-950">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{employees.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-purple-100 p-3 dark:bg-purple-950">
              <ScanFace className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xl font-bold">{terdaftar}</p>
              <p className="text-xs text-muted-foreground">Terdaftar Wajah</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari NIP, nama, atau unit..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setLoading(true)
          }}
          className="pl-10 h-12"
        />
      </div>

      {/* Employee list */}
      {loading ? (
        <LoadingState />
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-sm font-medium">Belum ada pegawai</p>
          <p className="text-xs text-muted-foreground">Tambahkan pegawai pertama</p>
        </div>
      ) : (
        <div className="space-y-2">
          {employees.map((emp) => {
            const initials = emp.nama_lengkap
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)

            return (
              <Card key={emp.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{emp.nama_lengkap}</p>
                      <p className="text-xs text-muted-foreground">{emp.nip}</p>
                      {emp.jabatan && (
                        <p className="text-xs text-muted-foreground truncate">{emp.jabatan}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {emp.is_terdaftar_wajah ? (
                        <Badge variant="success" className="text-[10px]">Wajah</Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => router.push(`/employees/${emp.id}/register-face`)}
                          disabled={!emp.status_aktif}
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggleStatus(emp.id, emp.status_aktif)}
                      >
                        {emp.status_aktif ? (
                          <PowerOff className="h-4 w-4 text-red-500" />
                        ) : (
                          <Power className="h-4 w-4 text-emerald-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
