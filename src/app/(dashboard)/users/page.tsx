"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/LoadingState"
import { createUser, deleteUser, updateUserRole, getUsers } from "@/actions/users"
import { getEmployees } from "@/actions/employees"
import { Plus, Trash2, UserCog } from "lucide-react"
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

  const roleLabel: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" }> = {
    super_admin: { label: "Super Admin", variant: "destructive" },
    admin: { label: "Admin", variant: "warning" },
    petugas: { label: "Petugas", variant: "default" },
  }

  if (loading) return <LoadingState />

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Pengguna</h1>
          <p className="text-sm text-muted-foreground">{users.length} user terdaftar</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="h-10 w-10 rounded-full">
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah User</DialogTitle>
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
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  defaultValue="petugas"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="petugas">Petugas</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_id">Link Pegawai</Label>
                <select
                  id="employee_id"
                  name="employee_id"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Tidak ada</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nama_lengkap} ({e.nip})
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full h-12">Buat User</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {users.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <UserCog className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-sm font-medium">Belum ada user</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <Card key={u.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{u.full_name || u.email}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="admin">Admin</option>
                      <option value="petugas">Petugas</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500"
                      onClick={() => handleDelete(u.id, u.email)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
