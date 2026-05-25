-- 2026-05-10: Custom Access Token Hook + helpers basados en JWT
-- Objetivo: que RLS y checks de rol no dependan de public.profiles.role (editable por el usuario).

-- 1) Auth Hook: inyecta claims.app_role en el JWT desde public.user_roles
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, app, pg_temp
AS $$
DECLARE
  claims jsonb;
  v_role public."Role";
BEGIN
  claims := COALESCE(event->'claims', '{}'::jsonb);

  SELECT COALESCE(ur.role, 'USER'::public."Role")
  INTO v_role
  FROM public.user_roles ur
  WHERE ur.user_id = (event->>'user_id')::uuid;

  v_role := COALESCE(v_role, 'USER'::public."Role");

  -- Set custom claim at top-level of claims (NOT user_metadata).
  claims := jsonb_set(
    claims,
    '{app_role}',
    to_jsonb(v_role::text),
    true
  );

  event := jsonb_set(event, '{claims}', claims, true);
  RETURN event;
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated, anon, public;

-- 2) Helpers: rol actual desde JWT (claim app_role)
CREATE OR REPLACE FUNCTION app.current_role()
RETURNS public."Role"
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(NULLIF(auth.jwt()->>'app_role', ''), 'USER')::public."Role";
$$;

CREATE OR REPLACE FUNCTION public.has_role(required_role public."Role")
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT app.current_role() = required_role;
$$;

