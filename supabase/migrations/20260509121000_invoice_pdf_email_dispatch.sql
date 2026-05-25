-- Async dispatch of invoice PDF generation and subscription email via pg_net
-- SCRUM-18 F6/F7 - wire register_subscription to Edge Functions

-- Enable pg_net extension (creates schema "net") if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Application settings: centralize Supabase Functions URL + service role key
CREATE TABLE IF NOT EXISTS app.settings (
  id boolean PRIMARY KEY DEFAULT true,
  supabase_functions_url text NOT NULL,
  service_role_key text NOT NULL
);

-- Seed singleton row with placeholders (must be updated in production)
INSERT INTO app.settings (id, supabase_functions_url, service_role_key)
VALUES (
  true,
  'https://<PROJECT_REF>.supabase.co/functions/v1',
  'REPLACE_WITH_SERVICE_ROLE_KEY'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- RPC: register_subscription — add pg_net dispatch
-- ============================================================================DROP FUNCTION IF EXISTS public.register_subscription(uuid, uuid, uuid, uuid);

CREATE OR REPLACE FUNCTION public.register_subscription(
  p_user_id text,
  p_plan_id uuid,
  p_duration_id uuid,
  p_offer_id uuid DEFAULT NULL
)
RETURNS TABLE(subscription_id uuid, invoice_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, app, pg_temp
AS $$
DECLARE
  v_user_uuid uuid;
  v_email text;
  v_name text;
  v_role public."Role";
  v_status public."UserStatus";
  v_price numeric(10,2);
  v_tax_rate numeric(5,2);
  v_discount_type public.discount_type;
  v_discount_value numeric(10,2);
  v_now date := CURRENT_DATE;
  v_subtotal numeric(10,2);
  v_tax_total numeric(10,2);
  v_total numeric(10,2);
  v_subscription_id uuid;
  v_invoice_id uuid;
  v_customer_snapshot jsonb;
  v_issuer_snapshot jsonb;
  v_functions_url text;
  v_service_role_key text;
BEGIN
  -- Solo staff puede registrar suscripciones
  IF NOT app.is_staff() THEN
    RAISE EXCEPTION 'Only staff can register subscriptions'
      USING ERRCODE = '42501';
  END IF;

  -- Intentar resolver el UUID del usuario
  IF p_user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    -- Si ya es un UUID, lo usamos directamente
    v_user_uuid := p_user_id::uuid;
  ELSE
    -- Si es un CUID antiguo, buscamos en public."User"
    SELECT u.auth_user_id, u.email, u.name, u.role, u.status
    INTO v_user_uuid, v_email, v_name, v_role, v_status
    FROM public."User" u
    WHERE u.id = p_user_id;

    IF v_email IS NULL THEN
      RAISE EXCEPTION 'Legacy user % not found in public.User', p_user_id;
    END IF;

    -- Si no estaba migrado, lo migramos al vuelo (creamos la cuenta en auth.users)
    IF v_user_uuid IS NULL THEN
      -- Comprobar si ya existe una cuenta en auth.users con ese email
      SELECT id INTO v_user_uuid FROM auth.users WHERE email = v_email;
      
      IF v_user_uuid IS NULL THEN
        v_user_uuid := gen_random_uuid();
        
        -- Evitar la violación de restricción única en el disparador on_auth_user_created:
        -- Renombramos temporalmente el email en el registro legacy.
        UPDATE public."User" SET email = email || '.legacy' WHERE id = p_user_id;
        
        -- Insertar en auth.users (esto disparará public.handle_new_user(),
        -- el cual insertará una nueva fila en public.User con id = v_user_uuid::text y el email original).
        INSERT INTO auth.users (
          id,
          instance_id,
          email,
          encrypted_password,
          email_confirmed_at,
          raw_app_meta_data,
          raw_user_meta_data,
          is_super_admin,
          role,
          aud
        )
        VALUES (
          v_user_uuid,
          '00000000-0000-0000-0000-000000000000',
          v_email,
          '$2y$10$abcdefghijklmnopqrstuvwxyz01234567890123456789',
          now(),
          jsonb_build_object('role', v_role::text, 'status', v_status::text),
          jsonb_build_object('name', v_name),
          false,
          'authenticated',
          'authenticated'
        );

        -- Copiar los detalles adicionales del usuario legacy al nuevo registro UUID
        UPDATE public."User" new_u
        SET "passwordHash" = old_u."passwordHash",
            height = old_u.height,
            "currentWeight" = old_u."currentWeight",
            "birthDate" = old_u."birthDate",
            gender = old_u.gender,
            "medicalNotes" = old_u."medicalNotes",
            "activityLevel" = old_u."activityLevel",
            goal = old_u.goal
        FROM public."User" old_u
        WHERE old_u.id = p_user_id
          AND new_u.id = v_user_uuid::text;

        -- Actualizar referencias en otras tablas relacionales
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Notification') THEN
          UPDATE public."Notification" SET "userId" = v_user_uuid::text WHERE "userId" = p_user_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Workout') THEN
          UPDATE public."Workout" SET "userId" = v_user_uuid::text WHERE "userId" = p_user_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Diet') THEN
          UPDATE public."Diet" SET "userId" = v_user_uuid::text WHERE "userId" = p_user_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ExerciseLog') THEN
          UPDATE public."ExerciseLog" SET "userId" = v_user_uuid::text WHERE "userId" = p_user_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'UserMeasurement') THEN
          UPDATE public."UserMeasurement" SET "userId" = v_user_uuid::text WHERE "userId" = p_user_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'BodyWeightRecord') THEN
          UPDATE public."BodyWeightRecord" SET "userId" = v_user_uuid::text WHERE "userId" = p_user_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ExerciseRecord') THEN
          UPDATE public."ExerciseRecord" SET "userId" = v_user_uuid::text WHERE "userId" = p_user_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AiChatSession') THEN
          UPDATE public."AiChatSession" SET "userId" = v_user_uuid::text WHERE "userId" = p_user_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_GymClassToUser') THEN
          UPDATE public."_GymClassToUser" SET "B" = v_user_uuid::text WHERE "B" = p_user_id;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ClassTrainer') THEN
          UPDATE public."ClassTrainer" SET "trainerId" = v_user_uuid::text WHERE "trainerId" = p_user_id;
        END IF;

        -- Eliminar el registro legacy temporal
        DELETE FROM public."User" WHERE id = p_user_id;
      ELSE
        -- Si ya existía el usuario en auth.users pero no estaba enlazado en User
        UPDATE public."User" SET auth_user_id = v_user_uuid WHERE id = p_user_id;
      END IF;

      -- Vincular en legacy_user_map
      INSERT INTO public.legacy_user_map (legacy_user_id, auth_user_id)
      VALUES (p_user_id, v_user_uuid)
      ON CONFLICT (legacy_user_id) DO NOTHING;
    END IF;
  END IF;

  -- Precio base
  SELECT pp.price, pp.tax_rate
  INTO v_price, v_tax_rate
  FROM public.plan_prices pp
  WHERE pp.plan_id = p_plan_id
    AND pp.duration_id = p_duration_id
    AND pp.active = true;

  IF v_price IS NULL THEN
    RAISE EXCEPTION 'No active price for plan % and duration %', p_plan_id, p_duration_id;
  END IF;

  -- Oferta (si aplica y está vigente)
  IF p_offer_id IS NOT NULL THEN
    SELECT o.discount_type, o.discount_value
    INTO v_discount_type, v_discount_value
    FROM public.special_offers o
    WHERE o.id = p_offer_id
      AND o.active = true
      AND (o.plan_id IS NULL OR o.plan_id = p_plan_id)
      AND (o.duration_id IS NULL OR o.duration_id = p_duration_id)
      AND (o.valid_from IS NULL OR v_now >= o.valid_from)
      AND (o.valid_to IS NULL OR v_now <= o.valid_to);

    IF v_discount_type IS NOT NULL THEN
      IF v_discount_type = 'percent' THEN
        v_price := GREATEST(0, v_price - (v_price * (v_discount_value / 100)));
      ELSE
        v_price := GREATEST(0, v_price - v_discount_value);
      END IF;
    END IF;
  END IF;

  -- Cálculo de totales
  v_subtotal := v_price;
  v_tax_total := round(v_price * (v_tax_rate / 100), 2);
  v_total := v_subtotal + v_tax_total;

  -- Snapshot del cliente (perfil actual)
  SELECT jsonb_build_object(
           'id', u.id,
           'email', u.email,
           'name', COALESCE(p.name, u.email),
           'role', COALESCE(ur.role, 'USER'::public."Role")
         )
  INTO v_customer_snapshot
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.user_roles ur ON ur.user_id = u.id
  WHERE u.id = v_user_uuid;

  IF v_customer_snapshot IS NULL THEN
    RAISE EXCEPTION 'User % not found for subscription', v_user_uuid;
  END IF;

  -- Snapshot del emisor (issuer_settings singleton)
  SELECT jsonb_build_object(
           'legal_name', i.legal_name,
           'tax_id', i.tax_id,
           'address', i.address,
           'email', i.email,
           'phone', i.phone,
           'logo_url', i.logo_url
         )
  INTO v_issuer_snapshot
  FROM public.issuer_settings i
  LIMIT 1;

  IF v_issuer_snapshot IS NULL THEN
    RAISE EXCEPTION 'issuer_settings row not configured';
  END IF;

  -- Transacción principal
  INSERT INTO public.subscriptions (
    user_id, plan_id, duration_id, offer_id,
    status, created_by, subtotal, tax_total, total
  )
  VALUES (
    v_user_uuid, p_plan_id, p_duration_id, p_offer_id,
    'active', auth.uid(), v_subtotal, v_tax_total, v_total
  )
  RETURNING id INTO v_subscription_id;

  INSERT INTO public.invoices (
    subscription_id, customer_snapshot, issuer_snapshot,
    subtotal, tax_total, total
  )
  VALUES (
    v_subscription_id, v_customer_snapshot, v_issuer_snapshot,
    v_subtotal, v_tax_total, v_total
  )
  RETURNING id INTO v_invoice_id;

  subscription_id := v_subscription_id;
  invoice_id := v_invoice_id;

  -- Dispatch asíncrono a Edge Functions vía pg_net (best-effort, no bloqueante)
  BEGIN
    SELECT supabase_functions_url, service_role_key
    INTO v_functions_url, v_service_role_key
    FROM app.settings
    WHERE id = true;
  EXCEPTION
    WHEN OTHERS THEN
      v_functions_url := NULL;
      v_service_role_key := NULL;
  END;

  IF v_functions_url IS NOT NULL AND v_service_role_key IS NOT NULL THEN
    BEGIN
      PERFORM
        net.http_post(
          url := v_functions_url || '/invoice-pdf',
          body := jsonb_build_object('invoice_id', v_invoice_id),
          params := '{}'::jsonb,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_service_role_key
          ),
          timeout_milliseconds := 5000
        );

      PERFORM
        net.http_post(
          url := v_functions_url || '/subscription-email',
          body := jsonb_build_object('subscription_id', v_subscription_id),
          params := '{}'::jsonb,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_service_role_key
          ),
          timeout_milliseconds := 5000
        );
    EXCEPTION
      WHEN OTHERS THEN
        -- No bloquear la transacción principal si pg_net falla
        NULL;
    END;
  END IF;

  RETURN NEXT;
END;
$$;
