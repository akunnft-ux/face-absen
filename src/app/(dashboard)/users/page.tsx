"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable, type Column } from "@/components/shared/DataTable"
import { createUser, deleteUser, updateUserRole, getUsers } from "@/actions/users"
import { getEmployees } from "@/actions/employees"
import { Plus, Trash2 } from "lucide-react"
import type { User, Employee } from "@/lib/types"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      const [u, e] = await Promise.all([getUsers(), getEmployees()])
      setUsers(u)
      setEmployees(e)
    } catch {
      // silent
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    try {
      await createUser({
        email: form.get("email") as string,
        password: form.get("password") as string,
        full_name: form.get("full_name") as string,
        role: (form.get("role") as string) as any,
        employee_id: (form.get("employee_id") as string) || undefined,
      })
      setDialogOpen(false)
      fetchUsers()
    } catch (err) {
      alert(String(err))
    }
  }

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Hapus user ${email}?`)) return
    try {
      await deleteUser(id)
      fetchUsers()
    } catch (err) {
      alert(String(err))
    }
  }

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await updateUserRole(id, role)
      fetchUsers()
    } catch (err) {
      alert(String(err))
    }
  }

  const columns: Column<User>[] = [
    {
      key: "email",
      header: "Email",
      render: (u) => <span className="font-medium">{u.email}</span>,
    },
    {
      key: "full_name",
      header: "Nama",
      render: (u) => u.full_name || "-",
    },
    {
      key: "role",
      header: "Role",
      render: (u) => (
        <Select
          defaultValue={u.role}
          onValueChange={(v) => handleRoleChange(u.id, v)}
        >
          <SelectTrigger className="h-8 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="petugas">Petugas</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      render: (u) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDelete(u.id, u.email)}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pengguna</h1>
          <p className="text-sm text-muted-foreground">
            {users.length} user terdaftar
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah User Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Nama Lengkap</Label>
                <Input id="full_name" name="full_name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  name="role"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  defaultValue="petugas"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="petugas">Petugas</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_id">Link ke Pegawai (opsional)</Label>
                <select
                  id="employee_id"
                  name="employee_id"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">Tidak ada</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nama_lengkap} ({e.nip})
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full">
                Buat User
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={users}
            loading={loading}
            searchable={false}
            emptyTitle="Belum ada user"
            emptyDescription="Tambahkan user pertama untuk memberikan akses"
            getKey={(u) => u.id}
          />
        </CardContent>
      </Card>
    </div>
  )
}
