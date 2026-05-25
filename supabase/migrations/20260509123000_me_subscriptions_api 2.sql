-- API de suscripciones para clientes (historial + descarga de facturas)
-- SCRUM-18 F9 - funciones RPC para la app Kotlin

-- Devuelve el historial de suscripciones del usuario autenticado junto con
-- la factura principal asociada.
CREATE OR REPLACE FUNCTION public.get_my_subscriptions()
RETURNS TABLE (
  subscription_id uuid,
  invoice_id uuid,
  plan_name text,
  plan_code text,
  duration_label text,
  start_date date,
  end_date date,
  status text,
  total numeric(10,2),
  invoice_number text,
  invoice_issue_date date
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    s.id AS subscription_id,
    i.id AS invoice_id,
    sp.name AS plan_name,
    sp.code AS plan_code,
    d.label AS duration_label,
    s.start_date,
    s.end_date,
    s.status,
    s.total,
    i.number AS invoice_number,
    i.issue_date AS invoice_issue_date
  FROM public.subscriptions s
  JOIN public.subscription_plans sp ON sp.id = s.plan_id
  JOIN public.plan_durations d ON d.id = s.duration_id
  JOIN public.invoices i ON i.subscription_id = s.id
  WHERE s.user_id = auth.uid()
  ORDER BY s.start_date DESC, i.issue_date DESC;
$$;

-- Genera una URL firmada temporal para descargar una factura concreta.
CREATE OR REPLACE FUNCTION public.get_invoice_signed_url(p_invoice_id uuid)
RETURNS TABLE (url text)
LANGUAGE plpgsql
AS $$
DECLARE
  v_path text;
  v_signed record;
BEGIN
  SELECT i.pdf_path
  INTO v_path
  FROM public.invoices i
  JOIN public.subscriptions s
    ON s.id = i.subscription_id
  WHERE i.id = p_invoice_id
    AND (
      s.user_id = auth.uid()
      OR app.is_staff()
    );

  IF v_path IS NULL THEN
    RAISE EXCEPTION 'Invoice not found or not accessible'
      USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_signed
  FROM storage.create_signed_url(
    bucket_id := 'invoices',
    path := v_path,
    expires_in := 60 * 60 * 24 * 7 -- 7 días
  );

  RETURN QUERY
  SELECT v_signed.signed_url::text AS url;
END;
$$;

