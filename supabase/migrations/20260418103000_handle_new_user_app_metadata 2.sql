-- Phase 1: respect app_metadata.status / role on signup (defaults preserved).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
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

  INSERT INTO public.profiles (id, email, name, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', 'Nuevo Usuario'),
    v_role,
    v_status
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        status = EXCLUDED.status;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;
