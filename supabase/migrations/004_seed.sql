-- Seed: 10 dummy employees + sample attendance
-- Run after all migrations

-- Employees
INSERT INTO employees (nip, nama_lengkap, jabatan, unit_kerja, email, nomor_hp, status_aktif) VALUES
  ('P001', 'Ahmad Fauzi', 'Staff IT', 'Teknologi Informasi', 'ahmad.fauzi@kantor.com', '081234567801', true),
  ('P002', 'Siti Nurhaliza', 'Staff Keuangan', 'Keuangan', 'siti.nurhaliza@kantor.com', '081234567802', true),
  ('P003', 'Budi Santoso', 'Staff HRD', 'Sumber Daya Manusia', 'budi.santoso@kantor.com', '081234567803', true),
  ('P004', 'Dewi Lestari', 'Staff Administrasi', 'Tata Usaha', 'dewi.lestari@kantor.com', '081234567804', true),
  ('P005', 'Rudi Hermawan', 'Staff Pemasaran', 'Pemasaran', 'rudi.hermawan@kantor.com', '081234567805', true),
  ('P006', 'Rina Wijaya', 'Staff Operasional', 'Operasional', 'rina.wijaya@kantor.com', '081234567806', true),
  ('P007', 'Hendra Gunawan', 'Staff Logistik', 'Logistik', 'hendra.gunawan@kantor.com', '081234567807', true),
  ('P008', 'Fitriani Hasanah', 'Staff Legal', 'Hukum', 'fitriani.hasanah@kantor.com', '081234567808', true),
  ('P009', 'Agus Prasetyo', 'Staff Pengadaan', 'Pengadaan Barang', 'agus.prasetyo@kantor.com', '081234567809', true),
  ('P010', 'Mega Sari', 'Staff Sekretaris', 'Sekretariat', 'mega.sari@kantor.com', '081234567810', true);

-- Sample attendance records for today (for testing dashboard)
-- Uncomment after Supabase setup is complete:
-- INSERT INTO face_attendance (employee_id, check_in_at, check_in_photo_url, match_confidence, liveness_score, liveness_passed)
-- SELECT id, now() - (random() * interval '3 hours'), 'https://via.placeholder.com/320', 0.85 + random() * 0.15, 0.9, true
-- FROM employees WHERE status_aktif = true
-- LIMIT 5;

-- How to add admin user:
-- 1. Go to Supabase Auth → Users → Add User
--    Email: admin@kantor.com
--    Password: Admin123!
-- 2. Get the User UUID from the created user
-- 3. Run: INSERT INTO users (id, email, full_name, role) VALUES ('[UUID]', 'admin@kantor.com', 'Super Admin', 'super_admin');
