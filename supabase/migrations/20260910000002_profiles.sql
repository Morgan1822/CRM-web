-- ====================================================================
-- 2. PROFILES TABLE (Linked to auth.users with soft delete & roles)
-- Shared between Next.js Web CRM and Flutter Mobile App
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
  phone TEXT,
  status TEXT DEFAULT 'active' NOT NULL, -- 'active', 'inactive', 'suspended'
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at TIMESTAMPTZ -- Soft delete support
);

-- Trigger to auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_default_role_id UUID;
  v_user_count INT;
BEGIN
  -- Count existing users: make first user Admin, subsequent users Agent by default
  SELECT COUNT(*) INTO v_user_count FROM public.profiles;

  IF v_user_count = 0 THEN
    v_default_role_id := '00000000-0000-0000-0000-000000000001'::uuid; -- Admin
  ELSE
    v_default_role_id := '00000000-0000-0000-0000-000000000003'::uuid; -- Agent
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role_id, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    v_default_role_id,
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
