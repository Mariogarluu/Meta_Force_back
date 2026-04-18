-- Supabase-native identity layer
-- Goal: Keep existing public."User" rows (legacy cuid ids) while introducing a canonical
-- uuid-based profile linked to auth.users. New Supabase Auth signups will populate both.

-- 1) Add link column on legacy table (non-breaking)
ALTER TABLE public."User"
  ADD COLUMN IF NOT EXISTS auth_user_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'User_auth_user_id_unique'
  ) THEN
    ALTER TABLE public."User"
      ADD CONSTRAINT "User_auth_user_id_unique" UNIQUE (auth_user_id);
  END IF;
END $$;

-- 2) Canonical profiles table (uuid PK = auth.users.id)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  legacy_user_id text UNIQUE,
  email text,
  name text,
  role "Role" NOT NULL DEFAULT 'USER',
  status "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();

-- 3) Mapping helper table to migrate legacy cuid users later
CREATE TABLE IF NOT EXISTS public.legacy_user_map (
  legacy_user_id text PRIMARY KEY,
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Update auth trigger: on signup create profile + backfill into legacy table for compatibility
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Canonical profile
  INSERT INTO public.profiles (id, email, name, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', 'Nuevo Usuario'),
    'USER',
    'ACTIVE'
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        name = EXCLUDED.name;

  -- Legacy table row (id stored as text UUID). Keeps existing code paths working.
  INSERT INTO public."User" (id, auth_user_id, email, name, status, role)
  VALUES (
    new.id::text,
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', 'Nuevo Usuario'),
    'ACTIVE',
    'USER'
  )
  ON CONFLICT (id) DO UPDATE
    SET auth_user_id = EXCLUDED.auth_user_id,
        email = EXCLUDED.email,
        name = EXCLUDED.name;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5) RLS for profiles (Supabase Auth is source of identity)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles: read own" ON public.profiles;
CREATE POLICY "Profiles: read own"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles: update own" ON public.profiles;
CREATE POLICY "Profiles: update own"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

