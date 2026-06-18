# PRD Template — AI Agent Development

Dokumen ini adalah template Product Requirements Document (PRD) yang dirancang khusus untuk memandu AI Agent dalam membangun project dengan **minimal error dan bug**. Setiap sektor wajib diisi dan diikuti.

---

## 1. Identitas Project

| Field | Isi |
|---|---|
| Nama Project | |
| Tujuan | 1-2 kalimat |
| Target Platform | Web / Mobile / Desktop |
| Framework Utama | (ex: Next.js 16, React Native, dll) |
| Bahasa | TypeScript (strict) |
| CSS / UI | (ex: Tailwind CSS v4, shadcn/ui) |
| Database | (ex: Supabase PostgreSQL) |
| Hosting | (ex: Vercel) |
| Deadline | |

---

## 2. Tech Stack — Versi & Known Pitfalls

> **Aturan**: Setiap library yang dipilih harus disertai versi eksak DAN daftar masalah yang sudah diketahui (anti-pattern). Ini adalah seksi PALING KRITIS untuk menghindari error.

### 2.1 Framework & Bahasa

```
[next.js]
- Versi: 16.0.x
- Routing: App Router
- Pitfall: middleware.ts diganti proxy.ts di Next.js 16
- Pitfall: cookies() dari next/headers harus await
- Pitfall: Server Action error message di-production dihilangkan, semua error throw harus di-catch dan di-return sebagai response

[typescript]
- strict: true
- Pitfall: Array.from(null) error — selalu guard sebelum conversion
```

### 2.2 Database & Auth

```
[supabase-js / @supabase/ssr]
- Versi: ^2.108.x / ^0.12.x
- Pitfall: getUser() di server action sering gagal karena cookie timing issue
  → Solusi: Semua server action WAJIB pakai admin client (service_role key), JANGAN getUser()
- Pitfall: signInWithPassword di server action → session cookie set di response headers, 
  client-side createBrowserClient mungkin tidak langsung membaca session dari cookies
  → Solusi: redirect() setelah login, jangan router.push()
- Pitfall: RLS policy untuk JOIN bisa gagal walau tiap tabel punya policy
  → Solusi: JOIN via server action (admin client) saja
```

### 2.3 Face Recognition / ML (Web)

```
[face-api.js / tensorflow.js]
- Versi: latest
- Pitfall: Model weights harus disimpan di public/ (local), jangan dari CDN
  → Di Vercel/TurboPack, CDN request bisa timeout
- Pitfall: TinyFaceDetector + inputSize:320 → landmark mata tidak presisi untuk EAR
  → JANGAN pakai blink detection sebagai liveness
  → Alternatif: cukup deteksi wajah stabil (5+ frame) sebagai verifikasi
- Pitfall: requestAnimationFrame + async detectSingleFace → frame drop
  → Selalu pakai try-catch di setiap detectSingleFace
  → Kalau error, jangan biarkan loop berhenti: lanjutkan rAF
- Pitfall: Closure di useEffect + rAF → stale state
  → Solusi: baca state via ref.current, bukan dari closure
```

### 2.4 UI Component

```
[shadcn/ui]
- Versi: kustom (bukan via CLI)
- Pitfall: Button disabled={saving || !descriptor} → kalau descriptor null, button disabled tanpa feedback
  → Selalu tampilkan pesan error jika guard clause return early

[lucide-react / icons]
- Versi: latest
```

---

## 3. Struktur Folder & Naming Conventions

```
src/
├── app/              # Routes (Next.js App Router)
│   ├── (auth)/       # Auth group
│   ├── (dashboard)/  # Protected group
│   └── ...
├── actions/          # Server Actions (ALL CRUD operations)
├── components/       # UI Components
│   ├── ui/           # Base components (button, card, input, dll)
│   ├── layout/       # Layout components (sidebar, navbar)
│   └── shared/       # Shared components (DataTable, LoadingState)
├── hooks/            # Custom hooks (useAuth, useCamera, dll)
├── lib/              # Types, utils, clients
│   ├── supabase/     # Supabase clients (client.ts, server.ts)
│   ├── types.ts      # Global types
│   └── utils.ts      # Utility functions
└── ...
```

### Naming Rules:
- **Server Actions**: camelCase, prefix kata kerja (createUser, getAttendance, dll)
- **Hooks**: camelCase, prefix "use" (useAuth, useCamera)
- **Components**: PascalCase
- **Files**: kebab-case (page.tsx, layout.tsx, not-found.tsx)
- **Types/interfaces**: PascalCase, tanpa prefix I

---

## 4. Data Flow Architecture

> **Diagram sirkuit data harus digambar sebelum coding dimulai.**

### 4.1 Client vs Server Boundary

```
┌─────────────────────────────────────────────────────┐
│  BROWSER CLIENT (anon key + session)                 │
│  - Read-only data yang tidak sensitif                │
│  - UI state, camera, face-api.js                     │
│  - createBrowserClient()                             │
│  - RLS aktif                                         │
├─────────────────────────────────────────────────────┤
│  SERVER ACTION (service_role key)                    │
│  - ALL writes (create, update, delete)               │
│  - ALL reads untuk data sensitif                     │
│  - createAdminClient()                               │
│  - Bypass RLS                                        │
├─────────────────────────────────────────────────────┤
│  SERVER COMPONENT (service_role key)                 │
│  - Initial data fetch untuk SSR                      │
│  - createAdminClient()                               │
├─────────────────────────────────────────────────────┤
│  MIDDLEWARE / PROXY                                  │
│  - Auth redirect, role-based routing                 │
│  - createServerClient() + cookies()                  │
│  - Pitfall: jangan baca public.users di proxy       │
│    → Solusi: baca user_metadata dari session token   │
└─────────────────────────────────────────────────────┘
```

### 4.2 Aturan Mutlak:

1. **Server action = admin client** — jangan pernah pakai `getUser()` di server action
2. **Auth check di UI** — guard clause di layout/page component, bukan di server action
3. **Role** — simpan di `user_metadata`, set SEBELUM signInWithPassword, baca dari session token (bukan dari DB)
4. **Session** — layout/useAuth baca dari session token langsung, jangan query DB dulu

---

## 5. Database Schema & RLS Matrix

Setiap tabel harus punya:

```
[nama_tabel]
- Columns: (nama, tipe, nullable, default, foreign key)
- RLS: ENABLED
- Policies:
  | Policy | Action | Role | Client |
  |--------|--------|------|--------|
  | admin_all | ALL | service_role | Admin Client |
  | auth_select | SELECT | authenticated | Browser Client |
  | auth_insert | INSERT | authenticated | Admin Client (via server action) |
```

**Aturan:**
- `service_role` = bypass RLS via admin client → untuk semua server action
- `authenticated` = user login via browser client → untuk read-only data publik
- `anon` = tanpa login → HANYA untuk data publik seperti halaman login

---

## 6. State Management & Component Patterns

### 6.1 Camera + Detection Loop (anti-pattern yang sudah diketahui)

```tsx
// ✅ PATTERN YANG BENAR:

// 1. State via ref untuk deteksi loop
const stateRef = useRef(state)
stateRef.current = state

// 2. try-catch di setiap detectSingleFace
const detect = async () => {
  let detection
  try {
    detection = await faceapi.detectSingleFace(video, ...)
  } catch {
    animRef.current = requestAnimationFrame(detect)
    return  // JANGAN biarkan loop berhenti
  }
  // ...process...
  animRef.current = requestAnimationFrame(detect)
}

// 3. useEffect + cleanup
useEffect(() => {
  detect()
  return () => cancelAnimationFrame(animRef.current)
}, [deps])  // HANYA deps yang benar-benar perlu
```

### 6.2 Error Display Pattern

```tsx
// ✅ Tampilkan error di UI
const [error, setError] = useState<string | null>(null)

// Semua operasi async: try-catch + setError
const handleAction = async () => {
  try {
    await someAction()
  } catch (e) {
    setError(String(e))  // Tampilkan ke user
  }
}

// Render
{error && <div className="text-red-500">{error}</div>}
```

### 6.3 Guard Clause Pattern

```tsx
// ✅ JANGAN silent return — tampilkan feedback
const handleSave = async () => {
  if (!descriptor || !capturedImage) {
    setError("Data wajah belum lengkap. Capture ulang.")
    return
  }
  // ...proceed...
}
```

---

## 7. Error Prevention Checklist

Sebelum commit/push, periksa:

- [ ] Semua async function punya try-catch
- [ ] Tidak ada closure yang membaca state usang (pakai ref.current)
- [ ] Server action tidak pakai getUser() (pakai admin client)
- [ ] Kamera: streamRef.current di-set sebelum detection loop
- [ ] Kamera: stopCamera() di cleanup useEffect
- [ ] Model ML: weights di public/ (bukan CDN)
- [ ] Model ML: try-catch di load + di setiap inference
- [ ] UI: tombol disabled tidak silent — kasih tooltip atau error message
- [ ] UI: loading state untuk semua async operation
- [ ] Auth: role dibaca dari user_metadata, bukan query DB
- [ ] Build: `npm run build` sukses tanpa error TypeScript

---

## 8. Testing Strategy

### 8.1 Unit Test (jika ada waktu)
- Setiap hook diuji dengan mock
- Setiap server action diuji dengan mock Supabase

### 8.2 Manual Test Checklist
- [ ] Login/logout flow
- [ ] Register user baru
- [ ] CRUD data
- [ ] Camera permission denied
- [ ] Camera not found
- [ ] Network offline
- [ ] Slow network
- [ ] Session expired → redirect ke login

---

## 9. Environment Variables

```
# Wajib
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Optional
NEXT_PUBLIC_APP_URL=
```

---

## 10. Deployment Checklist

- [ ] Environment variables terisi di Vercel / hosting
- [ ] Database migration sudah dijalankan
- [ ] Storage bucket sudah dibuat
- [ ] RLS policy sudah aktif
- [ ] Build production sukses
- [ ] Model weights (ML) terupload ke public/
- [ ] Test login dari device lain
- [ ] Test semua menu/route

---

## Cara Pakai Template Ini

1. Copy template ke file `PRD.md` di root project
2. Isi sektor 1 (Identitas) + 2 (Tech Stack) + 5 (Database)
3. Hapus sektor yang tidak relevan (misal face-api jika bukan project face recognition)
4. AI Agent membaca PRD sebagai **instruksi mengikat** — semua aturan di sini WAJIB diikuti
5. Selama development, jika menemukan anti-pattern baru, **tambahkan ke PRD** untuk project berikutnya
