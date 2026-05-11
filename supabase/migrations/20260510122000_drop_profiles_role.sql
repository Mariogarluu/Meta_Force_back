-- 2026-05-10: eliminar perfiles.role/status y evitar escalado de privilegios
-- - profiles deja de ser fuente de verdad de roles
-- - roles pasan a public.user_roles + claim JWT via Auth Hook

-- 1) Actualizar handle_new_user para NO escribir roles en profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, app, pg_temp
AS $$
DECLARE
  v_role public."Role";
  v_status public."UserStatus";
BEGIN
  v_role := COALESCE(
    (NULLIF(trim(new.raw_app_meta_data->>'role'), ''))::public."Role",
    'USER'::public."Role"
  );
  v_status := COALESCE(
    (NULLIF(trim(new.raw_app_meta_data->>'status'), ''))::public."UserStatus",
    'ACTIVE'::public."UserStatus"
  );

  -- Canonical profile (no role/status aquí)
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', 'Nuevo Usuario')
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        name = EXCLUDED.name;

  -- Fuente de verdad del rol (para el Auth Hook)
  INSERT INTO public.user_roles (user_id, role, granted_by, updated_at)
  VALUES (new.id, v_role, NULL, now())
  ON CONFLICT (user_id) DO NOTHING;

  -- Legacy table row: se mantiene para compatibilidad
  INSERT INTO public."User" (id, auth_user_id, email, name, status, role, "passwordHash")
  VALUES (
    new.id::text,
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', 'Nuevo Usuario'),
    v_status,
    v_role,
    NULL
  )
  ON CONFLICT (id) DO UPDATE
    SET auth_user_id = EXCLUDED.auth_user_id,
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        status = EXCLUDED.status,
        role = EXCLUDED.role;

  RETURN new;
END;
$$;

-- 2) Column privileges + RLS: profiles actualizable solo en campos no sensibles
REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
GRANT UPDATE (name) ON TABLE public.profiles TO authenticated;

DROP POLICY IF EXISTS "Profiles: update own" ON public.profiles;
CREATE POLICY "Profiles: update own (name only)"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3) Eliminar columnas sensibles de profiles
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS role,
  DROP COLUMN IF EXISTS status;

-- 4) Legacy public."User": impedir que un usuario cambie role/status por su cuenta
CREATE OR REPLACE FUNCTION public.block_self_role_status_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, app, pg_temp
AS $$
BEGIN
  -- Admin puede gestionar usuarios por UI/RPC; el usuario normal NO.
  IF NOT public.is_admin() THEN
    IF (NEW.role IS DISTINCT FROM OLD.role) OR (NEW.status IS DISTINCT FROM OLD.status) THEN
      RAISE EXCEPTION 'role/status are not user-editable';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS block_self_role_status_update ON public."User";
CREATE TRIGGER block_self_role_status_update
BEFORE UPDATE ON public."User"
FOR EACH ROW
WHEN (auth.uid() = NEW.auth_user_id OR auth.uid()::text = NEW.id)
EXECUTE PROCEDURE public.block_self_role_status_update();

