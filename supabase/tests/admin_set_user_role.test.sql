-- Test: solo SUPERADMIN puede ejecutar admin_set_user_role
DO $$
DECLARE
  v_super_id uuid := gen_random_uuid();
  v_user_id uuid := gen_random_uuid();
  v_role text;
BEGIN
  INSERT INTO auth.users (id, email)
  VALUES (v_super_id, 'superadmin_role_test@example.com'),
         (v_user_id, 'user_role_test@example.com');

  --------------------------------------------------------------------
  -- Usuario normal: debe fallar
  --------------------------------------------------------------------
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

  BEGIN
    PERFORM public.admin_set_user_role(v_user_id, 'TRAINER');
    RAISE EXCEPTION 'admin_set_user_role: USER pudo ejecutar la RPC (no esperado)';
  EXCEPTION
    WHEN others THEN NULL;
  END;

  RESET ROLE;
  PERFORM set_config('request.jwt.claims', NULL, true);

  --------------------------------------------------------------------
  -- SUPERADMIN: debe funcionar
  --------------------------------------------------------------------
  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', v_super_id::text,
      'role', 'authenticated',
      'app_role', 'SUPERADMIN'
    )::text,
    true
  );
  SET LOCAL ROLE authenticated;

  PERFORM public.admin_set_user_role(v_user_id, 'TRAINER');

  SELECT ur.role::text INTO v_role
  FROM public.user_roles ur
  WHERE ur.user_id = v_user_id;

  IF v_role IS DISTINCT FROM 'TRAINER' THEN
    RAISE EXCEPTION 'admin_set_user_role: esperado TRAINER, obtenido %', v_role;
  END IF;

  RESET ROLE;
  PERFORM set_config('request.jwt.claims', NULL, true);
END $$;

