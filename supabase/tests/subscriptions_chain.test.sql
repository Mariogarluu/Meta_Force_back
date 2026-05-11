-- Test: encadenado de fechas en suscripciones
DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_plan_id uuid;
  v_duration_id uuid;
  v_sub1 public.subscriptions%ROWTYPE;
  v_sub2 public.subscriptions%ROWTYPE;
BEGIN
  -- Crear usuario mínimo en auth.users para satisfacer FKs
  INSERT INTO auth.users (id, email)
  VALUES (v_user_id, 'test_chain@example.com');

  SELECT id INTO v_plan_id
  FROM public.subscription_plans
  WHERE code = 'standard';

  SELECT id INTO v_duration_id
  FROM public.plan_durations
  WHERE months = 6;

  IF v_plan_id IS NULL OR v_duration_id IS NULL THEN
    RAISE EXCEPTION 'Catálogo de suscripciones no inicializado para el test.';
  END IF;

  -- Primera suscripción
  INSERT INTO public.subscriptions (
    user_id, plan_id, duration_id, offer_id,
    start_date, end_date, status, created_by,
    subtotal, tax_total, total
  )
  VALUES (
    v_user_id, v_plan_id, v_duration_id, NULL,
    CURRENT_DATE, CURRENT_DATE, 'active', v_user_id,
    100, 21, 121
  )
  RETURNING * INTO v_sub1;

  -- Segunda suscripción consecutiva para el mismo usuario
  INSERT INTO public.subscriptions (
    user_id, plan_id, duration_id, offer_id,
    start_date, end_date, status, created_by,
    subtotal, tax_total, total
  )
  VALUES (
    v_user_id, v_plan_id, v_duration_id, NULL,
    CURRENT_DATE, CURRENT_DATE, 'active', v_user_id,
    100, 21, 121
  )
  RETURNING * INTO v_sub2;

  IF v_sub2.start_date <> v_sub1.end_date + INTERVAL '1 day' THEN
    RAISE EXCEPTION 'subscriptions_chain: start_date no encadenado correctamente (% vs %)',
      v_sub2.start_date, v_sub1.end_date;
  END IF;
END $$;

