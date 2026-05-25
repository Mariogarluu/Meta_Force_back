-- Subscriptions core schema: roles helpers, catalog, subscriptions and invoices
-- F0/F1/F2 of SCRUM-18 (Sistema de Suscripciones)

-- Schema for app-level helpers
CREATE SCHEMA IF NOT EXISTS app;

-- Helper: current role of the authenticated user (from public.profiles)
CREATE OR REPLACE FUNCTION app.current_role()
RETURNS public."Role"
LANGUAGE sql
STABLE
AS $$
  SELECT p.role
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

-- Helper: is the current user staff? (superadmin, admin_center, trainer)
CREATE OR REPLACE FUNCTION app.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.has_role('SUPERADMIN')
      OR public.has_role('ADMIN_CENTER')
      OR public.has_role('TRAINER');
$$;

-- Helper: is the current user superadmin?
CREATE OR REPLACE FUNCTION app.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.has_role('SUPERADMIN');
$$;

-- =====================================================================
-- Catálogo de planes de suscripción
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plan_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  feature_text text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plan_durations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  months integer NOT NULL CHECK (months > 0),
  label text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plan_prices (
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  duration_id uuid NOT NULL REFERENCES public.plan_durations(id) ON DELETE CASCADE,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  tax_rate numeric(5,2) NOT NULL DEFAULT 21 CHECK (tax_rate >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (plan_id, duration_id)
);

CREATE TYPE public.discount_type AS ENUM ('percent', 'amount');

CREATE TABLE IF NOT EXISTS public.special_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  plan_id uuid REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  duration_id uuid REFERENCES public.plan_durations(id) ON DELETE CASCADE,
  discount_type public.discount_type NOT NULL,
  discount_value numeric(10,2) NOT NULL CHECK (discount_value >= 0),
  valid_from date,
  valid_to date,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Datos fiscales del emisor (singleton editable por superadmin)
CREATE TABLE IF NOT EXISTS public.issuer_settings (
  id boolean PRIMARY KEY DEFAULT true, -- siempre una fila
  legal_name text NOT NULL,
  tax_id text NOT NULL,
  address text NOT NULL,
  email text,
  phone text,
  iban text,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Reutilizar trigger genérico de updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_subscription_plans_updated_at'
  ) THEN
    CREATE TRIGGER set_subscription_plans_updated_at
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW
    EXECUTE PROCEDURE public.set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_plan_features_updated_at'
  ) THEN
    CREATE TRIGGER set_plan_features_updated_at
    BEFORE UPDATE ON public.plan_features
    FOR EACH ROW
    EXECUTE PROCEDURE public.set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_plan_durations_updated_at'
  ) THEN
    CREATE TRIGGER set_plan_durations_updated_at
    BEFORE UPDATE ON public.plan_durations
    FOR EACH ROW
    EXECUTE PROCEDURE public.set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_plan_prices_updated_at'
  ) THEN
    CREATE TRIGGER set_plan_prices_updated_at
    BEFORE UPDATE ON public.plan_prices
    FOR EACH ROW
    EXECUTE PROCEDURE public.set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_special_offers_updated_at'
  ) THEN
    CREATE TRIGGER set_special_offers_updated_at
    BEFORE UPDATE ON public.special_offers
    FOR EACH ROW
    EXECUTE PROCEDURE public.set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_issuer_settings_updated_at'
  ) THEN
    CREATE TRIGGER set_issuer_settings_updated_at
    BEFORE UPDATE ON public.issuer_settings
    FOR EACH ROW
    EXECUTE PROCEDURE public.set_updated_at();
  END IF;
END $$;

-- =====================================================================
-- Subscriptions & invoices
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  duration_id uuid NOT NULL REFERENCES public.plan_durations(id),
  offer_id uuid REFERENCES public.special_offers(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  subtotal numeric(10,2) NOT NULL CHECK (subtotal >= 0),
  tax_total numeric(10,2) NOT NULL CHECK (tax_total >= 0),
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE RESTRICT,
  number text UNIQUE,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  customer_snapshot jsonb NOT NULL,
  issuer_snapshot jsonb NOT NULL,
  subtotal numeric(10,2) NOT NULL CHECK (subtotal >= 0),
  tax_total numeric(10,2) NOT NULL CHECK (tax_total >= 0),
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  pdf_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_subscriptions_updated_at'
  ) THEN
    CREATE TRIGGER set_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE PROCEDURE public.set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_invoices_updated_at'
  ) THEN
    CREATE TRIGGER set_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE PROCEDURE public.set_updated_at();
  END IF;
END $$;

-- Encadenado de fechas de suscripción
CREATE OR REPLACE FUNCTION public.before_insert_subscription_set_dates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_months integer;
  v_last_end date;
BEGIN
  SELECT d.months INTO v_months
  FROM public.plan_durations d
  WHERE d.id = NEW.duration_id;

  IF v_months IS NULL THEN
    RAISE EXCEPTION 'Invalid duration_id % for subscription', NEW.duration_id;
  END IF;

  SELECT MAX(end_date) INTO v_last_end
  FROM public.subscriptions
  WHERE user_id = NEW.user_id
    AND status = 'active'
    AND end_date >= CURRENT_DATE;

  IF v_last_end IS NOT NULL THEN
    NEW.start_date := v_last_end + INTERVAL '1 day';
  ELSE
    NEW.start_date := CURRENT_DATE;
  END IF;

  NEW.end_date := (NEW.start_date + (v_months || ' months')::interval)::date;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS before_insert_subscription_set_dates ON public.subscriptions;
CREATE TRIGGER before_insert_subscription_set_dates
BEFORE INSERT ON public.subscriptions
FOR EACH ROW
EXECUTE PROCEDURE public.before_insert_subscription_set_dates();

-- Numeración de facturas
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_year text := to_char(current_date, 'YYYY');
  v_seq int := nextval('public.invoice_number_seq');
BEGIN
  RETURN v_year || '-' || lpad(v_seq::text, 5, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.before_insert_invoice_set_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.number IS NULL THEN
    NEW.number := public.generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS before_insert_invoice_set_number ON public.invoices;
CREATE TRIGGER before_insert_invoice_set_number
BEFORE INSERT ON public.invoices
FOR EACH ROW
EXECUTE PROCEDURE public.before_insert_invoice_set_number();

CREATE OR REPLACE FUNCTION app.has_active_subscription(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.user_id = p_user_id
      AND s.status = 'active'
      AND CURRENT_DATE BETWEEN s.start_date AND s.end_date
  );
$$;

-- Helper público para comprobar acceso activo (RPC para el cliente)
CREATE OR REPLACE FUNCTION public.has_active_access()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT app.is_staff() OR app.has_active_subscription(auth.uid());
$$;

-- =====================================================================
-- RLS para catálogo, suscripciones e invoices
-- =====================================================================

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_durations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issuer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Catálogo: lectura para autenticados, escritura solo superadmin
DO $$
BEGIN
  DROP POLICY IF EXISTS "subscription_plans: read (authenticated)" ON public.subscription_plans;
  CREATE POLICY "subscription_plans: read (authenticated)"
  ON public.subscription_plans FOR SELECT
  TO authenticated
  USING (true);

  DROP POLICY IF EXISTS "subscription_plans: write (superadmin)" ON public.subscription_plans;
  CREATE POLICY "subscription_plans: write (superadmin)"
  ON public.subscription_plans FOR ALL
  TO authenticated
  USING (app.is_superadmin())
  WITH CHECK (app.is_superadmin());

  DROP POLICY IF EXISTS "plan_features: read (authenticated)" ON public.plan_features;
  CREATE POLICY "plan_features: read (authenticated)"
  ON public.plan_features FOR SELECT
  TO authenticated
  USING (true);

  DROP POLICY IF EXISTS "plan_features: write (superadmin)" ON public.plan_features;
  CREATE POLICY "plan_features: write (superadmin)"
  ON public.plan_features FOR ALL
  TO authenticated
  USING (app.is_superadmin())
  WITH CHECK (app.is_superadmin());

  DROP POLICY IF EXISTS "plan_durations: read (authenticated)" ON public.plan_durations;
  CREATE POLICY "plan_durations: read (authenticated)"
  ON public.plan_durations FOR SELECT
  TO authenticated
  USING (true);

  DROP POLICY IF EXISTS "plan_durations: write (superadmin)" ON public.plan_durations;
  CREATE POLICY "plan_durations: write (superadmin)"
  ON public.plan_durations FOR ALL
  TO authenticated
  USING (app.is_superadmin())
  WITH CHECK (app.is_superadmin());

  DROP POLICY IF EXISTS "plan_prices: read (authenticated)" ON public.plan_prices;
  CREATE POLICY "plan_prices: read (authenticated)"
  ON public.plan_prices FOR SELECT
  TO authenticated
  USING (true);

  DROP POLICY IF EXISTS "plan_prices: write (superadmin)" ON public.plan_prices;
  CREATE POLICY "plan_prices: write (superadmin)"
  ON public.plan_prices FOR ALL
  TO authenticated
  USING (app.is_superadmin())
  WITH CHECK (app.is_superadmin());

  DROP POLICY IF EXISTS "special_offers: read (authenticated)" ON public.special_offers;
  CREATE POLICY "special_offers: read (authenticated)"
  ON public.special_offers FOR SELECT
  TO authenticated
  USING (true);

  DROP POLICY IF EXISTS "special_offers: write (superadmin)" ON public.special_offers;
  CREATE POLICY "special_offers: write (superadmin)"
  ON public.special_offers FOR ALL
  TO authenticated
  USING (app.is_superadmin())
  WITH CHECK (app.is_superadmin());

  DROP POLICY IF EXISTS "issuer_settings: read (authenticated)" ON public.issuer_settings;
  CREATE POLICY "issuer_settings: read (authenticated)"
  ON public.issuer_settings FOR SELECT
  TO authenticated
  USING (true);

  DROP POLICY IF EXISTS "issuer_settings: write (superadmin)" ON public.issuer_settings;
  CREATE POLICY "issuer_settings: write (superadmin)"
  ON public.issuer_settings FOR ALL
  TO authenticated
  USING (app.is_superadmin())
  WITH CHECK (app.is_superadmin());
END $$;

-- Suscripciones: propio usuario o staff
DO $$
BEGIN
  DROP POLICY IF EXISTS "subscriptions: read own or staff" ON public.subscriptions;
  CREATE POLICY "subscriptions: read own or staff"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR app.is_staff());

  DROP POLICY IF EXISTS "subscriptions: insert via rpc only" ON public.subscriptions;
  CREATE POLICY "subscriptions: insert via rpc only"
  ON public.subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (app.is_staff());

  DROP POLICY IF EXISTS "subscriptions: update delete (superadmin)" ON public.subscriptions;
  CREATE POLICY "subscriptions: update delete (superadmin)"
  ON public.subscriptions FOR UPDATE
  TO authenticated
  USING (app.is_superadmin())
  WITH CHECK (app.is_superadmin());

  DROP POLICY IF EXISTS "subscriptions: delete (superadmin)" ON public.subscriptions;
  CREATE POLICY "subscriptions: delete (superadmin)"
  ON public.subscriptions FOR DELETE
  TO authenticated
  USING (app.is_superadmin());
END $$;

-- Invoices: propio usuario o staff
DO $$
BEGIN
  DROP POLICY IF EXISTS "invoices: read own or staff" ON public.invoices;
  CREATE POLICY "invoices: read own or staff"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.subscriptions s
      WHERE s.id = invoices.subscription_id
        AND (s.user_id = auth.uid() OR app.is_staff())
    )
  );

  DROP POLICY IF EXISTS "invoices: insert (staff)" ON public.invoices;
  CREATE POLICY "invoices: insert (staff)"
  ON public.invoices FOR INSERT
  TO authenticated
  WITH CHECK (app.is_staff());
END $$;

-- =====================================================================
-- RPC: register_subscription
-- =====================================================================

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
  RETURN NEXT;
END;
$$;


-- =====================================================================
-- Seed inicial de catálogo (3 modalidades × 4 duraciones)
-- =====================================================================

DO $$
DECLARE
  v_basic_id uuid;
  v_standard_id uuid;
  v_premium_id uuid;
  v_m1_id uuid;
  v_m3_id uuid;
  v_m6_id uuid;
  v_m12_id uuid;
BEGIN
  -- Duraciones
  INSERT INTO public.plan_durations (months, label)
  VALUES
    (1, '1 mes'),
    (3, '3 meses'),
    (6, '6 meses'),
    (12, '12 meses')
  ON CONFLICT (months) DO NOTHING;

  SELECT id INTO v_m1_id FROM public.plan_durations WHERE months = 1;
  SELECT id INTO v_m3_id FROM public.plan_durations WHERE months = 3;
  SELECT id INTO v_m6_id FROM public.plan_durations WHERE months = 6;
  SELECT id INTO v_m12_id FROM public.plan_durations WHERE months = 12;

  -- Planes
  INSERT INTO public.subscription_plans (code, name, description, position)
  VALUES
    ('basic', 'Basic', 'Acceso a centros + entrenamientos básicos', 1),
    ('standard', 'Standard', 'Basic + clases grupales + dietas', 2),
    ('premium', 'Premium', 'Standard + IA Coach + analítica avanzada', 3)
  ON CONFLICT (code) DO NOTHING;

  SELECT id INTO v_basic_id FROM public.subscription_plans WHERE code = 'basic';
  SELECT id INTO v_standard_id FROM public.subscription_plans WHERE code = 'standard';
  SELECT id INTO v_premium_id FROM public.subscription_plans WHERE code = 'premium';

  -- Features (solo se insertan si aún no hay ninguna fila para el plan)
  IF NOT EXISTS (SELECT 1 FROM public.plan_features WHERE plan_id = v_basic_id) THEN
    INSERT INTO public.plan_features (plan_id, feature_text, position)
    VALUES
      (v_basic_id, 'Acceso a centros Meta Force', 1),
      (v_basic_id, 'Entrenamientos personalizados básicos', 2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.plan_features WHERE plan_id = v_standard_id) THEN
    INSERT INTO public.plan_features (plan_id, feature_text, position)
    VALUES
      (v_standard_id, 'Todo lo de Basic', 1),
      (v_standard_id, 'Clases grupales ilimitadas', 2),
      (v_standard_id, 'Planes de dieta personalizados', 3);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.plan_features WHERE plan_id = v_premium_id) THEN
    INSERT INTO public.plan_features (plan_id, feature_text, position)
    VALUES
      (v_premium_id, 'Todo lo de Standard', 1),
      (v_premium_id, 'Coach IA avanzado', 2),
      (v_premium_id, 'Panel de analítica de progreso', 3);
  END IF;

  -- Precios (solo se insertan si aún no existe combinación plan+duración)
  INSERT INTO public.plan_prices (plan_id, duration_id, price, tax_rate)
  VALUES
    (v_basic_id, v_m1_id, 25, 21),
    (v_basic_id, v_m3_id, 70, 21),
    (v_basic_id, v_m6_id, 130, 21),
    (v_basic_id, v_m12_id, 240, 21),
    (v_standard_id, v_m1_id, 40, 21),
    (v_standard_id, v_m3_id, 110, 21),
    (v_standard_id, v_m6_id, 200, 21),
    (v_standard_id, v_m12_id, 360, 21),
    (v_premium_id, v_m1_id, 60, 21),
    (v_premium_id, v_m3_id, 165, 21),
    (v_premium_id, v_m6_id, 300, 21),
    (v_premium_id, v_m12_id, 540, 21)
  ON CONFLICT (plan_id, duration_id) DO NOTHING;

  -- Asegurar que la columna iban existe (por si la tabla ya existía antes de agregarla)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'issuer_settings'
      AND column_name = 'iban'
  ) THEN
    ALTER TABLE public.issuer_settings ADD COLUMN iban text;
  END IF;

  -- Seed de issuer_settings (singleton)
  INSERT INTO public.issuer_settings (id, legal_name, tax_id, address, email, phone, iban, logo_url)
  VALUES (
    true,
    'Meta Force Fitness S.L.',
    'B12345678',
    'Calle de la Fuerza 42, 28001 Madrid, España',
    'contacto@metaforce.com',
    '+34 910 000 000',
    'ES1234567890123456789012',
    'https://meta-force-psi.vercel.app/assets/logo.png'
  )
  ON CONFLICT (id) DO NOTHING;
END $$;


