-- Test: no debe ser posible escalar rol modificando profiles ni escribiendo user_roles
DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, email)
  VALUES (v_user_id, 'role_isolation@example.com');

  -- Simula sesión USER
  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', v_user_id::text,
      'role', 'authenticated',
      'app_role', 'USER'
    )::text,
    true
  );
  SET LOCAL ROLE authenticated;

  -- 1) profiles.role ya no debe existir
  BEGIN
    UPDATE public.profiles
    SET role = 'SUPERADMIN'
    WHERE id = v_user_id;

    RAISE EXCEPTION 'role_isolation: se pudo actualizar profiles.role (no esperado)';
  EXCEPTION
    WHEN undefined_column THEN NULL;
    WHEN others THEN NULL;
  END;

  -- 2) user_roles no debe permitir INSERT por authenticated (salvo service_role)
  BEGIN
    INSERT INTO public.user_roles (user_id, role, granted_by)
    VALUES (v_user_id, 'SUPERADMIN', v_user_id);

    RAISE EXCEPTION 'role_isolation: authenticated pudo insertar en user_roles (no esperado)';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
    WHEN others THEN NULL;
  END;

  RESET ROLE;
  PERFORM set_config('request.jwt.claims', NULL, true);
END $$;

