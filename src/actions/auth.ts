"use server"

import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function login(formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const admin = createAdminClient()
  const { data: existingUsers } = await admin.auth.admin.listUsers()
  const authUser = existingUsers?.users?.find((u) => u.email === email)

  if (authUser) {
    const { data: profile } = await admin
      .from("users")
      .select("role")
      .eq("id", authUser.id)
      .single()

    if (profile?.role) {
      await admin.auth.admin.updateUserById(authUser.id, {
        user_metadata: { role: profile.role },
      })
    }
  }

  const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: "Email atau password salah" }

  const { data: profile } = await admin
    .from("users")
    .select("role")
    .eq("id", signInData.user!.id)
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
