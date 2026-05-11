-- Test: numeración de facturas (YYYY-NNNNN secuencial)
DO $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_plan_id uuid;
  v_duration_id uuid;
  v_sub_id uuid;
  v_numbers text[];
  v_year text := to_char(current_date, 'YYYY');
BEGIN
  INSERT INTO auth.users (id, email)
  VALUES (v_user_id, 'test_invoice@example.com');

  SELECT id INTO v_plan_id
  FROM public.subscription_plans
  WHERE code = 'standard';

  SELECT id INTO v_duration_id
  FROM public.plan_durations
  WHERE months = 6;

  IF v_plan_id IS NULL OR v_duration_id IS NULL THEN
    RAISE EXCEPTION 'Catálogo de suscripciones no inicializado para el test.';
  END IF;

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
  RETURNING id INTO v_sub_id;

  v_numbers := ARRAY[]::text[];

  FOR i IN 1..5 LOOP
    PERFORM NULL; -- separador visual
    INSERT INTO public.invoices (
      subscription_id,
      customer_snapshot,
      issuer_snapshot,
      subtotal,
      tax_total,
      total
    )
    VALUES (
      v_sub_id,
      jsonb_build_object('id', v_user_id),
      jsonb_build_object('legal_name', 'Test Issuer'),
      100,
      21,
      121
    )
    RETURNING number INTO v_numbers[i];
  END LOOP;

  IF array_length(v_numbers, 1) <> 5 THEN
    RAISE EXCEPTION 'invoice_numbering: se esperaban 5 números de factura, obtenidos %',
      array_length(v_numbers, 1);
  END IF;

  -- Comprobar formato y que sean secuenciales
  FOR i IN 1..5 LOOP
    IF v_numbers[i] IS NULL OR v_numbers[i] !~ ('^' || v_year || '-[0-9]{5}$') THEN
      RAISE EXCEPTION 'invoice_numbering: formato inválido para %', v_numbers[i];
    END IF;

    IF i > 1 THEN
      -- Comparar la parte numérica
      IF (substring(v_numbers[i] from 6)::int)
           <> (substring(v_numbers[i-1] from 6)::int) + 1 THEN
        RAISE EXCEPTION 'invoice_numbering: secuencia no correlativa entre % y %',
          v_numbers[i-1], v_numbers[i];
      END IF;
    END IF;
  END LOOP;
END $$;

