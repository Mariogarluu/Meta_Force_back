-- Adjust RLS on public."User" to work with legacy cuid ids linked to Supabase Auth (auth_user_id).

ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON public."User";
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON public."User";

-- Read own row if it's linked, or if id is already the uuid text (new users)
CREATE POLICY "User: read own (auth link)"
ON public."User" FOR SELECT
USING (
  auth.uid() = auth_user_id OR auth.uid()::text = id
);

CREATE POLICY "User: update own (auth link)"
ON public."User" FOR UPDATE
USING (
  auth.uid() = auth_user_id OR auth.uid()::text = id
)
WITH CHECK (
  auth.uid() = auth_user_id OR auth.uid()::text = id
);

