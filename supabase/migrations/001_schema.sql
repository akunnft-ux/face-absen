-- Migration 001: Initial Schema
-- Run this in Supabase SQL Editor

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Employees table
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nip VARCHAR(50) UNIQUE NOT NULL,
  nama_lengkap VARCHAR(255) NOT NULL,
  jabatan VARCHAR(255),
  unit_kerja VARCHAR(255),
  email VARCHAR(255),
  nomor_hp VARCHAR(50),
  foto_profil_url TEXT,
  is_terdaftar_wajah BOOLEAN DEFAULT false,
  status_aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Face descriptors (pgvector)
CREATE TABLE face_descriptors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  descriptor VECTOR(128) NOT NULL,
  foto_registrasi_url TEXT NOT NULL,
  quality_score FLOAT DEFAULT 0.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_face_descriptors_employee ON face_descriptors(employee_id);
CREATE INDEX idx_face_descriptors_vector ON face_descriptors USING ivfflat (descriptor vector_cosine_ops) WITH (lists = 100);

-- Face attendance records
CREATE TABLE face_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  check_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_in_photo_url TEXT NOT NULL,
  match_confidence FLOAT NOT NULL,
  liveness_score FLOAT DEFAULT 0.0,
  liveness_passed BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_face_attendance_employee ON face_attendance(employee_id);
CREATE INDEX idx_face_attendance_date ON face_attendance(check_in_at);

-- Users table (links to auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'petugas')),
  employee_id UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
