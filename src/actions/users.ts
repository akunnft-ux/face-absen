"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { UserInput } from "@/lib/types"

export async function getUsers() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("users")
    .select("*, employee:employees(nama_lengkap)")
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function createUser(input: UserInput) {
  const adminClient = createAdminClient()

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  })

  if (authError) throw new Error(`Gagal create auth user: ${authError.message}`)

  const supabase = await createServerSupabaseClient()
  const { error: profileError } = await supabase.from("users").insert({
    id: authData.user.id,
    email: input.email,
    full_name: input.full_name,
    role: input.role,
    employee_id: input.employee_id || null,
  })

  if (profileError) {
    await adminClient.auth.admin.deleteUser(authData.user.id)
    throw new Error(`Gagal create profile: ${profileError.message}`)
  }

  revalidatePath("/users")
}

export async function updateUserRole(id: string, role: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from("users").update({ role }).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/users")
}

export async function deleteUser(id: string) {
  const adminClient = createAdminClient()
  const { error: authError } = await adminClient.auth.admin.deleteUser(id)
  if (authError) throw new Error(`Gagal hapus auth user: ${authError.message}`)

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from("users").delete().eq("id", id)
  if (error) throw new Error(`Gagal hapus profile: ${error.message}`)

  revalidatePath("/users")
}

// Helper untuk createAdminClient
function createAdminClient() {
  const { createClient } = require("@supabase/supabase-js")
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  )
}
