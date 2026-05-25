-- =============================================================================
-- MIGRACIÓN: Políticas RLS para el panel de analíticas del Superadmin
-- Fecha: 2026-05-23
-- Problema: El superadmin no podía leer las tablas User, BodyWeightRecord,
--   ExerciseRecord, user_roles ni subscriptions porque:
--   1) Las políticas de user_roles usaban app.is_staff() → permission denied for schema app
--   2) No existían políticas que permitieran al superadmin leer TODAS las filas
-- Solución: Función helper is_superadmin() basada en user_roles (sin schema app)
--   + políticas de lectura global para SUPERADMIN en todas las tablas analíticas
-- =============================================================================

-- 1) Función helper: ¿es el usuario actual SUPERADMIN?
--    Lee directamente de public.user_roles, sin depender del schema app.
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'SUPERADMIN'::"Role"
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;

-- 2) Función helper: ¿es el usuario actual ADMIN o SUPERADMIN?
--    Reemplaza la que usaba profiles.role (que ya no tiene esa columna)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('SUPERADMIN'::"Role", 'ADMIN_CENTER'::"Role")
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- =============================================================================
-- 3) Tabla: public."User"
--    - El propio usuario puede leer su fila (ya existe o se recrea)
--    - El SUPERADMIN puede leer TODAS las filas
-- =============================================================================
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User: select own" ON public."User";
CREATE POLICY "User: select own"
ON public."User" FOR SELECT
TO authenticated
USING (
  auth.uid()::text = id
  OR auth.uid() = auth_user_id
);

DROP POLICY IF EXISTS "User: superadmin read all" ON public."User";
CREATE POLICY "User: superadmin read all"
ON public."User" FOR SELECT
TO authenticated
USING (public.is_superadmin());

DROP POLICY IF EXISTS "User: update own" ON public."User";
CREATE POLICY "User: update own"
ON public."User" FOR UPDATE
TO authenticated
USING (
  auth.uid()::text = id
  OR auth.uid() = auth_user_id
)
WITH CHECK (
  auth.uid()::text = id
  OR auth.uid() = auth_user_id
);

DROP POLICY IF EXISTS "User: superadmin write all" ON public."User";
CREATE POLICY "User: superadmin write all"
ON public."User" FOR ALL
TO authenticated
USING (public.is_superadmin())
WITH CHECK (public.is_superadmin());

-- =============================================================================
-- 4) Tabla: public."BodyWeightRecord"
--    - El propio usuario puede leer/escribir sus registros
--    - El SUPERADMIN puede leer TODOS los registros (para analíticas)
-- =============================================================================
DROP POLICY IF EXISTS "BodyWeightRecord: superadmin read all" ON public."BodyWeightRecord";
CREATE POLICY "BodyWeightRecord: superadmin read all"
ON public."BodyWeightRecord" FOR SELECT
TO authenticated
USING (public.is_superadmin());

-- =============================================================================
-- 5) Tabla: public."ExerciseRecord"
--    - El propio usuario puede leer/escribir sus registros
--    - El SUPERADMIN puede leer TODOS los registros (para analíticas)
-- =============================================================================
DROP POLICY IF EXISTS "ExerciseRecord: superadmin read all" ON public."ExerciseRecord";
CREATE POLICY "ExerciseRecord: superadmin read all"
ON public."ExerciseRecord" FOR SELECT
TO authenticated
USING (public.is_superadmin());

-- =============================================================================
-- 6) Tabla: public.user_roles
--    - Reemplazamos la política que usa app.is_staff() (que falla)
--    - El propio usuario puede leer su rol
--    - El SUPERADMIN puede leer TODOS los roles
-- =============================================================================
DROP POLICY IF EXISTS "user_roles: read own or staff" ON public.user_roles;
CREATE POLICY "user_roles: read own"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_roles: superadmin read all" ON public.user_roles;
CREATE POLICY "user_roles: superadmin read all"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.is_superadmin());

-- Escritura: solo el superadmin (o service_role via RPC SECURITY DEFINER)
DROP POLICY IF EXISTS "user_roles: write (service_role)" ON public.user_roles;
CREATE POLICY "user_roles: superadmin write"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_superadmin())
WITH CHECK (public.is_superadmin());

-- =============================================================================
-- 7) Tabla: public.subscriptions
--    - El propio usuario puede leer sus suscripciones
--    - El SUPERADMIN puede leer TODAS (para analíticas)
-- =============================================================================
DROP POLICY IF EXISTS "subscriptions: superadmin read all" ON public.subscriptions;
CREATE POLICY "subscriptions: superadmin read all"
ON public.subscriptions FOR SELECT
TO authenticated
USING (public.is_superadmin());

-- =============================================================================
-- 8) Garantizar que authenticated puede leer la tabla Exercise (para nombres)
-- =============================================================================
DROP POLICY IF EXISTS "Exercise: read (authenticated)" ON public."Exercise";
CREATE POLICY "Exercise: read (authenticated)"
ON public."Exercise" FOR SELECT
TO authenticated
USING (true);

-- =============================================================================
-- 9) Dar permisos de SELECT en las tablas al rol authenticated
-- =============================================================================
GRANT SELECT ON TABLE public."User" TO authenticated;
GRANT SELECT ON TABLE public."BodyWeightRecord" TO authenticated;
GRANT SELECT ON TABLE public."ExerciseRecord" TO authenticated;
GRANT SELECT ON TABLE public.user_roles TO authenticated;
GRANT SELECT ON TABLE public.subscriptions TO authenticated;
GRANT SELECT ON TABLE public."Exercise" TO authenticated;
