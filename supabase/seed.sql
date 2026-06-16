-- Seed: 10 dummy employees
INSERT INTO employees (nip, nama_lengkap, jabatan, unit_kerja, email, nomor_hp, status_aktif)
VALUES
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

-- Seed: 1 super admin user (harus dibuat manual via Supabase Auth UI)
-- Email: admin@kantor.com / Password: Admin123!
-- Setelah create user di Auth, INSERT ke public.users:
-- INSERT INTO users (id, email, full_name, role)
-- VALUES ('[UUID from auth.users]', 'admin@kantor.com', 'Super Admin', 'super_admin');
