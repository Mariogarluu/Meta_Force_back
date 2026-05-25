-- 2026-04-25: fixes de seguridad y perfiles
-- - Asegura search_path estable en handle_new_user (lint de seguridad)
-- - Restaura SELECT publico acotado al bucket 'profiles'
-- - Añade politica explicita de INSERT para public.profiles

-- 1) search_path en handle_new_user
ALTER FUNCTION public.handle_new_user()
  SET search_path = public, auth, pg_temp;

-- 2) Storage: SELECT publico solo para bucket 'profiles'
CREATE POLICY "profiles_bucket_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profiles');

-- 3) RLS: permitir INSERT en profiles al usuario autenticado sobre su propia fila
DROP POLICY IF EXISTS "Profiles: insert own" ON public.profiles;
CREATE POLICY "Profiles: insert own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

