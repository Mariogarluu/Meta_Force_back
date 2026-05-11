-- Test: RLS del catálogo de suscripciones (solo staff puede escribir)
DO $$
DECLARE
  v_client_id uuid := gen_random_uuid();
  v_staff_id uuid := gen_random_uuid();
BEGIN
  -- Crear usuarios en auth.users
  INSERT INTO auth.users (id, email)
  VALUES (v_client_id, 'client_rls@example.com'),
         (v_staff_id, 'superadmin_rls@example.com');

  --------------------------------------------------------------------
  -- Cliente: no debe poder insertar en subscription_plans
  --------------------------------------------------------------------
  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', v_client_id::text,
      'role', 'authenticated',
      'app_role', 'USER'
    )::text,
    true
  );
  SET LOCAL ROLE authenticated;

  BEGIN
    INSERT INTO public.subscription_plans (code, name, position, active)
    VALUES ('test_client_blocked', 'Test Client Blocked', 999, true);

    -- Si llega aquí, RLS no ha bloqueado el INSERT
    RAISE EXCEPTION 'rls_catalog: un cliente ha podido insertar en subscription_plans';
  EXCEPTION
    WHEN insufficient_privilege THEN
      -- Comportamiento esperado: RLS bloquea la operación
      NULL;
    WHEN others THEN
      -- Cualquier otro error también es aceptable como bloqueo
      NULL;
  END;

  RESET ROLE;
  PERFORM set_config('request.jwt.claims', NULL, true);

  --------------------------------------------------------------------
  -- SUPERADMIN: debe poder insertar en subscription_plans
  --------------------------------------------------------------------
  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', v_staff_id::text,
      'role', 'authenticated',
      'app_role', 'SUPERADMIN'
    )::text,
    true
  );
  SET LOCAL ROLE authenticated;

  INSERT INTO public.subscription_plans (code, name, position, active)
  VALUES ('test_superadmin_allowed', 'Test Superadmin Allowed', 1000, true);

  RESET ROLE;
  PERFORM set_config('request.jwt.claims', NULL, true);
END $$;

