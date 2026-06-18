"use server"

import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { EmployeeInput } from "@/lib/types"

export async function getEmployees(search?: string, filter?: string) {
  const supabase = await createServerSupabaseClient()
  let query = supabase.from("employees").select("*").order("created_at", { ascending: false })

  if (filter === "aktif") query = query.eq("status_aktif", true)
  else if (filter === "nonaktif") query = query.eq("status_aktif", false)

  if (search) {
    query = query.or(
      `nip.ilike.%${search}%,nama_lengkap.ilike.%${search}%,unit_kerja.ilike.%${search}%`
    )
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

export async function getEmployeeById(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from("employees").select("*").eq("id", id).single()
  return data
}

export async function createEmployee(input: EmployeeInput) {
  const supabase = await createServerSupabaseClient()

  const { data: existing } = await supabase
    .from("employees")
    .select("id")
    .eq("nip", input.nip)
    .maybeSingle()

  if (existing) throw new Error(`NIP ${input.nip} sudah terdaftar.`)

  const { data, error } = await supabase
    .from("employees")
    .insert({ ...input })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath("/employees")
  return data
}

export async function updateEmployee(id: string, input: Partial<EmployeeInput>) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("employees")
    .update(input)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath("/employees")
  return data
}

export async function toggleEmployeeStatus(id: string, status: boolean) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from("employees")
    .update({ status_aktif: status })
    .eq("id", id)

  if (error) throw new Error(error.message)
  revalidatePath("/employees")
}

export async function deleteEmployee(id: string) {
  const supabase = createAdminClient()

  const { data: descriptors } = await supabase
    .from("face_descriptors")
    .select("foto_registrasi_url")
    .eq("employee_id", id)

  if (descriptors) {
    for (const d of descriptors) {
      const path = d.foto_registrasi_url.split("/storage/v1/object/public/face-photos/")[1]
      if (path) await supabase.storage.from("face-photos").remove([path])
    }
  }

  await supabase.from("face_attendance").delete().eq("employee_id", id)
  await supabase.from("users").update({ employee_id: null }).eq("employee_id", id)
  await supabase.from("face_descriptors").delete().eq("employee_id", id)
  await supabase.from("employees").delete().eq("id", id)

  revalidatePath("/employees")
}
