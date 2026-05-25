-- 2026-05-10: RPC para obtener el rol actual sin depender de profiles

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TABLE(role public."Role")
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(ur.role, 'USER'::public."Role") AS role
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  UNION ALL
  SELECT 'USER'::public."Role" AS role
  WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur2 WHERE ur2.user_id = auth.uid())
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

