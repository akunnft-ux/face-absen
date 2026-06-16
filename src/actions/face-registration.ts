"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function registerFace(
  employeeId: string,
  descriptor: number[],
  imageBase64: string,
  qualityScore: number
) {
  const supabase = createAdminClient()

  const filename = `${employeeId}/${crypto.randomUUID()}.jpg`
  const buffer = Buffer.from(imageBase64.split(",")[1], "base64")

  const { error: uploadError } = await supabase.storage
    .from("face-photos")
    .upload(`registrations/${filename}`, buffer, {
      contentType: "image/jpeg",
      upsert: false,
    })

  if (uploadError) throw new Error(`Upload gagal: ${uploadError.message}`)

  const { data: urlData } = await supabase.storage
    .from("face-photos")
    .getPublicUrl(`registrations/${filename}`)

  const { error: descError } = await supabase.from("face_descriptors").insert({
    employee_id: employeeId,
    descriptor: descriptor,
    foto_registrasi_url: urlData.publicUrl,
    quality_score: qualityScore,
  })

  if (descError) throw new Error(`Gagal menyimpan descriptor: ${descError.message}`)

  await supabase
    .from("employees")
    .update({ is_terdaftar_wajah: true })
    .eq("id", employeeId)

  revalidatePath("/employees")
  revalidatePath(`/employees/${employeeId}`)
}

export async function registerFaceForMultiple(
  employeeIds: string[],
  descriptor: number[],
  imageBase64: string,
  qualityScore: number
) {
  const results = []
  for (const employeeId of employeeIds) {
    try {
      await registerFace(employeeId, descriptor, imageBase64, qualityScore)
      results.push({ employeeId, success: true })
    } catch (e) {
      results.push({ employeeId, success: false, error: String(e) })
    }
  }
  return results
}
