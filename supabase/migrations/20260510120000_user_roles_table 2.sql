-- 2026-05-10: defensa en profundidad de roles
-- Fuente de verdad: public.user_roles (no editable por el propio usuario)
-- Escritura: solo via RPC admin_set_user_role (SECURITY DEFINER) o service_role

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public."Role" NOT NULL,
  granted_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Lectura: el propio usuario, staff o service_role.
DROP POLICY IF EXISTS "user_roles: read own or staff" ON public.user_roles;
CREATE POLICY "user_roles: read own or staff"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR app.is_staff()
  OR auth.role() = 'service_role'
);

-- Escritura: solo service_role. (La RPC SECURITY DEFINER no depende de policies.)
DROP POLICY IF EXISTS "user_roles: write (service_role)" ON public.user_roles;
CREATE POLICY "user_roles: write (service_role)"
ON public.user_roles FOR ALL
TO authenticated
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Backfill desde profiles.role para no romper instalaciones existentes.
INSERT INTO public.user_roles (user_id, role, granted_by)
SELECT p.id, p.role, NULL
FROM public.profiles p
ON CONFLICT (user_id) DO NOTHING;

-- RPC: solo SUPERADMIN puede cambiar roles.
-- Nota: también puede disparar un sign-out remoto (si existe app.settings + pg_net).
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_user_id uuid,
  p_role public."Role"
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, app, extensions, pg_temp
AS $$
DECLARE
  v_functions_url text;
  v_service_role_key text;
BEGIN
  IF NOT app.is_superadmin() THEN
    RAISE EXCEPTION 'Only SUPERADMIN can change roles';
  END IF;

  INSERT INTO public.user_roles (user_id, role, granted_by, updated_at)
  VALUES (p_user_id, p_role, auth.uid(), now())
  ON CONFLICT (user_id) DO UPDATE
    SET role = EXCLUDED.role,
        granted_by = EXCLUDED.granted_by,
        updated_at = now();

  -- Compatibilidad: mantener public."User".role sincronizado para UI legacy.
  UPDATE public."User"
  SET role = p_role
  WHERE auth_user_id = p_user_id OR id = p_user_id::text;

  -- Best-effort: forzar cierre de sesión global del usuario afectado.
  -- Se activará cuando exista la Edge Function admin-signout.
  BEGIN
    SELECT supabase_functions_url, service_role_key
    INTO v_functions_url, v_service_role_key
    FROM app.settings
    WHERE id = true;

    IF v_functions_url IS NOT NULL AND v_service_role_key IS NOT NULL THEN
      PERFORM net.http_post(
        url := v_functions_url || '/admin-signout',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_service_role_key
        ),
        body := jsonb_build_object('user_id', p_user_id)
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Non-blocking: si falta pg_net, settings o la función, no romper la transacción.
    NULL;
  END;
END;
$$;

REVOKE ALL ON TABLE public.user_roles FROM anon, authenticated;
GRANT SELECT ON TABLE public.user_roles TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public."Role") TO authenticated;

