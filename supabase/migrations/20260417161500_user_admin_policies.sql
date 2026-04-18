-- Admin policies for public."User" (needed for admin UI)

DROP POLICY IF EXISTS "User: admin read all" ON public."User";
CREATE POLICY "User: admin read all"
ON public."User" FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "User: admin update" ON public."User";
CREATE POLICY "User: admin update"
ON public."User" FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

