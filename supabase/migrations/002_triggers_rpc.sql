-- Migration 002: Triggers and Functions
-- Run after 001_schema.sql

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Face matching function using pgvector cosine similarity
CREATE OR REPLACE FUNCTION match_face(
  query_descriptor VECTOR(128),
  match_threshold FLOAT DEFAULT 0.45
)
RETURNS TABLE (
  employee_id UUID,
  nip VARCHAR,
  nama_lengkap VARCHAR,
  similarity FLOAT,
  foto_registrasi_url TEXT,
  descriptor_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.nip,
    e.nama_lengkap,
    1 - (fd.descriptor <=> query_descriptor) AS similarity,
    fd.foto_registrasi_url,
    fd.id
  FROM face_descriptors fd
  JOIN employees e ON e.id = fd.employee_id
  WHERE fd.is_active = true
    AND e.status_aktif = true
    AND 1 - (fd.descriptor <=> query_descriptor) > match_threshold
  ORDER BY fd.descriptor <=> query_descriptor
  LIMIT 1;
END;
$$;
