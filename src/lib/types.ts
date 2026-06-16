export type Role = "super_admin" | "admin" | "petugas"

export interface User {
  id: string
  email: string
  full_name: string
  role: Role
  employee_id: string | null
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  nip: string
  nama_lengkap: string
  jabatan: string | null
  unit_kerja: string | null
  email: string | null
  nomor_hp: string | null
  foto_profil_url: string | null
  status_aktif: boolean
  is_terdaftar_wajah: boolean
  created_at: string
  updated_at: string
}

export interface FaceDescriptor {
  id: string
  employee_id: string
  descriptor: number[]
  foto_registrasi_url: string
  quality_score: number
  is_active: boolean
  created_at: string
}

export interface FaceAttendance {
  id: string
  employee_id: string
  employee?: Employee
  check_in_at: string
  check_in_photo_url: string
  match_confidence: number
  liveness_score: number
  liveness_passed: boolean
  metadata: Record<string, unknown>
  created_at: string
}

export interface EmployeeInput {
  nip: string
  nama_lengkap: string
  jabatan?: string
  unit_kerja?: string
  email?: string
  nomor_hp?: string
}

export interface UserInput {
  email: string
  password: string
  full_name: string
  role: Role
  employee_id?: string
}

export type AttendanceStatus = "hadir" | "terlambat" | "alpha"

export interface MonthlyRecap {
  employee_id: string
  nip: string
  nama_lengkap: string
  total_hadir: number
  total_terlambat: number
  total_alpha: number
  total_hari_kerja: number
  persentase: number
}
