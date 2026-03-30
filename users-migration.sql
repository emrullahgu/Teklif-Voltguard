-- Users tablosu (SimpleAuth akisi icin zorunlu)
-- Supabase SQL Editor'da calistirin.

CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  company TEXT,
  location TEXT,
  role TEXT DEFAULT 'user',
  approved BOOLEAN DEFAULT false,
  can_access_bordro BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_approved ON public.users(approved);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION update_users_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION update_users_updated_at_column();

INSERT INTO public.users (email, password, name, company, location, role, approved, can_access_bordro)
VALUES ('info@voltguard.com.tr', 'Eg8502Eg.', 'Admin', 'VoltGuard', 'Kemalpaşa Osb', 'admin', true, true)
ON CONFLICT (email) DO UPDATE
SET
  role = EXCLUDED.role,
  approved = EXCLUDED.approved,
  can_access_bordro = EXCLUDED.can_access_bordro,
  location = EXCLUDED.location,
  updated_at = NOW();
