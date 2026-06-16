-- Helper function to check admin role (bypasses RLS)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
  );
$$;

-- employees
CREATE POLICY "admin_all_employees" ON employees
  FOR ALL USING (is_admin());

CREATE POLICY "petugas_select_employees" ON employees
  FOR SELECT USING (auth.role() = 'authenticated');

-- face_descriptors
CREATE POLICY "admin_all_descriptors" ON face_descriptors
  FOR ALL USING (is_admin());

CREATE POLICY "auth_select_descriptors" ON face_descriptors
  FOR SELECT USING (auth.role() = 'authenticated');

-- face_attendance
CREATE POLICY "admin_all_attendance" ON face_attendance
  FOR ALL USING (is_admin());

CREATE POLICY "petugas_insert_attendance" ON face_attendance
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
  );

CREATE POLICY "auth_select_attendance" ON face_attendance
  FOR SELECT USING (auth.role() = 'authenticated');

-- users
CREATE POLICY "super_admin_all_users" ON users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "auth_select_users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Enable RLS on all tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_descriptors ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
