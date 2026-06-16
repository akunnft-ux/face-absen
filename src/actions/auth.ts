"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function login(formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !signInData.user) return { error: "Email atau password salah" }

  const supabase2 = await createServerSupabaseClient()
  const { data: profile } = await supabase2
    .from("users")
    .select("role")
    .eq("id", signInData.user.id)
    .single()

  revalidatePath("/", "layout")

  if (profile?.role === "super_admin" || profile?.role === "admin") {
    redirect("/dashboard")
  }
  redirect("/attendance")
}

export async function logout() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/login")
}
