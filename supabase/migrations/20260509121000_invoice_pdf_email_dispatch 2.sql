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
-- ============================================================================

CREATE OR REPLACE FUNCTION public.register_subscription(
  p_user_id uuid,
  p_plan_id uuid,
  p_duration_id uuid,
  p_offer_id uuid DEFAULT NULL
)
RETURNS TABLE(subscription_id uuid, invoice_id uuid)
LANGUAGE plpgsql
AS $$
DECLARE
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
           'role', p.role
         )
  INTO v_customer_snapshot
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = p_user_id;

  IF v_customer_snapshot IS NULL THEN
    RAISE EXCEPTION 'User % not found for subscription', p_user_id;
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
    p_user_id, p_plan_id, p_duration_id, p_offer_id,
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

