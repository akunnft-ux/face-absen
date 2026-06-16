# Face-Absen - Face Recognition Attendance System

## Tech Stack
- Next.js 16 (App Router, Turbopack)
- TypeScript (strict mode)
- Tailwind CSS v4
- shadcn/ui (kustom, bukan via CLI)
- Supabase (PostgreSQL + pgvector + Auth + Storage)
- face-api.js (TensorFlow.js - browser-side face recognition)
- Vercel (hosting)

## Perintah Penting
- `npm run dev` — Jalankan development server
- `npm run build` — Build production
- `npm run start` — Start production server

## Struktur Kode
- `src/app/` — Routes dan pages
- `src/actions/` — Server Actions (all CRUD)
- `src/components/` — UI components
- `src/hooks/` — Custom hooks (useAuth, useCamera, useLiveness, useFaceDetection)
- `src/lib/` — Types, utils, Supabase clients
- `supabase/migrations/` — SQL migrations untuk setup database

## Catatan Penting
- `proxy.ts` adalah pengganti `middleware.ts` di Next.js 16
- Semua form menggunakan `<form action={serverAction}>` pattern
- Face recognition berjalan di browser via face-api.js (TinyFaceDetector + FaceRecognitionNet)
- Model weights disimpan di `public/models/`, di-load sebagai `MODEL_URL = "/models"` (lokal, bukan CDN)
- Liveness detection menggunakan EAR (Eye Aspect Ratio) blink detection
- Face descriptor 128D disimpan di pgvector (cosine similarity)
- Threshold match_face: 0.45 (cosine distance) → similarity > 0.55

## Setup Database
1. Buat project di Supabase
2. Buka SQL Editor
3. Jalankan file migrasi berurutan: 001 → 002 → 003 → 004
4. Buat bucket `face-photos` di Supabase Storage (public)
5. Buat user admin via Auth UI (Auth → Users → Add User)
6. INSERT user ke public.users

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` — URL project Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon key Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (untuk admin operations)
