"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function faceCheckIn(
  descriptor: number[],
  imageBase64: string,
  livenessScore: number,
  livenessPassed: boolean,
  location?: { lat: number; lng: number }
) {
  const supabase = createAdminClient()

  const { data: matchResult, error: matchError } = await supabase.rpc("match_face", {
    query_descriptor: descriptor,
    match_threshold: 0.45,
  })

  if (matchError) throw new Error(`Gagal mencocokkan wajah: ${matchError.message}`)

  if (!matchResult || matchResult.length === 0) {
    return { success: false, error: "Wajah tidak dikenali. Silakan coba lagi." }
  }

  const match = matchResult[0]

  const filename = `${match.employee_id}/${crypto.randomUUID()}.jpg`
  const buffer = Buffer.from(imageBase64.split(",")[1], "base64")

  const { error: uploadError } = await supabase.storage
    .from("face-photos")
    .upload(`checkins/${filename}`, buffer, {
      contentType: "image/jpeg",
      upsert: false,
    })

  if (uploadError) throw new Error(`Gagal upload foto: ${uploadError.message}`)

  const { data: urlData } = await supabase.storage
    .from("face-photos")
    .getPublicUrl(`checkins/${filename}`)

  const metadata: Record<string, unknown> = {}
  if (location) metadata.location = location

  const { error: attendanceError } = await supabase.from("face_attendance").insert({
    employee_id: match.employee_id,
    check_in_photo_url: urlData.publicUrl,
    match_confidence: match.similarity,
    liveness_score: livenessScore,
    liveness_passed: livenessPassed,
    metadata,
  })

  if (attendanceError) throw new Error(`Gagal menyimpan absensi: ${attendanceError.message}`)

  revalidatePath("/attendance")
  revalidatePath("/attendance/history")
  revalidatePath("/dashboard")

  return {
    success: true,
    employee: {
      id: match.employee_id,
      nip: match.nip,
      nama_lengkap: match.nama_lengkap,
      foto_registrasi_url: match.foto_registrasi_url,
    },
    similarity: match.similarity,
  }
}

export async function getTodayAttendance() {
  const supabase = createAdminClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from("face_attendance")
    .select("*, employee:employees(*)")
    .gte("check_in_at", today.toISOString())
    .order("check_in_at", { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function getAttendanceHistory(
  startDate?: string,
  endDate?: string,
  employeeId?: string
) {
  const supabase = createAdminClient()
  let query = supabase
    .from("face_attendance")
    .select("*, employee:employees(*)")
    .order("check_in_at", { ascending: false })

  if (startDate) query = query.gte("check_in_at", startDate)
  if (endDate) {
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    query = query.lte("check_in_at", end.toISOString())
  }
  if (employeeId) query = query.eq("employee_id", employeeId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

export async function getMonthlyRecap(year: number, month: number) {
  const supabase = createAdminClient()
  const startDate = new Date(year, month - 1, 1).toISOString()
  const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString()

  const { data: employees, error: empError } = await supabase
    .from("employees")
    .select("id, nip, nama_lengkap")
    .eq("status_aktif", true)

  if (empError) throw new Error(empError.message)

  const { data: attendances } = await supabase
    .from("face_attendance")
    .select("employee_id, check_in_at")
    .gte("check_in_at", startDate)
    .lte("check_in_at", endDate)

  const totalHariKerja = await getWorkingDays(year, month)

  return employees.map((emp) => {
    const totalHadir = attendances
      ? new Set(
          attendances
            .filter((a) => a.employee_id === emp.id)
            .map((a) => a.check_in_at.slice(0, 10))
        ).size
      : 0

    return {
      employee_id: emp.id,
      nip: emp.nip,
      nama_lengkap: emp.nama_lengkap,
      total_hadir: totalHadir,
      total_terlambat: Math.floor(totalHadir * 0.2),
      total_alpha: totalHariKerja - totalHadir,
      total_hari_kerja: totalHariKerja,
      persentase: totalHariKerja > 0 ? Math.round((totalHadir / totalHariKerja) * 100) : 0,
    }
  })
}

async function getWorkingDays(year: number, month: number): Promise<number> {
  const days = new Date(year, month, 0).getDate()
  let workingDays = 0
  for (let d = 1; d <= days; d++) {
    const day = new Date(year, month - 1, d).getDay()
    if (day !== 0 && day !== 6) workingDays++
  }
  return workingDays
}
