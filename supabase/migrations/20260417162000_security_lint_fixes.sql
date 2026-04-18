-- Fix Supabase advisors (security lints)

-- 1) Set stable search_path on functions (prevents search_path hijacking)
ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, auth, pg_temp;
ALTER FUNCTION public.current_user_id_text() SET search_path = public, pg_temp;
ALTER FUNCTION public.has_role("Role") SET search_path = public, pg_temp;
ALTER FUNCTION public.is_admin() SET search_path = public, pg_temp;

-- 2) RLS policies missing on some tables
-- ClassTrainer: admin-managed
ALTER TABLE public."ClassTrainer" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ClassTrainer: read (authenticated)" ON public."ClassTrainer";
CREATE POLICY "ClassTrainer: read (authenticated)"
ON public."ClassTrainer" FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "ClassTrainer: write (admin)" ON public."ClassTrainer";
CREATE POLICY "ClassTrainer: write (admin)"
ON public."ClassTrainer" FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- _GymClassToUser: user enrollment could be user-driven, but keep admin-only writes for now
ALTER TABLE public."_GymClassToUser" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "GymClassToUser: read (authenticated)" ON public."_GymClassToUser";
CREATE POLICY "GymClassToUser: read (authenticated)"
ON public."_GymClassToUser" FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "GymClassToUser: write (admin)" ON public."_GymClassToUser";
CREATE POLICY "GymClassToUser: write (admin)"
ON public."_GymClassToUser" FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Ticket: allow authenticated users to create; admin can read/manage
ALTER TABLE public."Ticket" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ticket: insert (authenticated)" ON public."Ticket";
CREATE POLICY "Ticket: insert (authenticated)"
ON public."Ticket" FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Ticket: read/manage (admin)" ON public."Ticket";
CREATE POLICY "Ticket: read/manage (admin)"
ON public."Ticket" FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- legacy_user_map: admin-only
ALTER TABLE public.legacy_user_map ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "legacy_user_map: admin only" ON public.legacy_user_map;
CREATE POLICY "legacy_user_map: admin only"
ON public.legacy_user_map FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- _prisma_migrations: internal history (avoid exposed table with RLS enabled but no policies)
ALTER TABLE public._prisma_migrations DISABLE ROW LEVEL SECURITY;

-- 3) Storage: avoid broad SELECT policy on public bucket (prevents listing)
DROP POLICY IF EXISTS "Avatar public access" ON storage.objects;

