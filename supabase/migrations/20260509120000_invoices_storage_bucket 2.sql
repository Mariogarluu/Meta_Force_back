-- Storage bucket for invoices PDFs
-- SCRUM-18 F6 - create private 'invoices' bucket with strict policies

-- Create private bucket 'invoices' if it does not exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Policies for invoices bucket:
-- - Read: only invoice owner (subscription user) or staff
-- - Write: only service_role (Edge Functions / backend)

DO $$
BEGIN
  -- Drop existing policies for this bucket to ensure idempotency
  PERFORM 1
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname IN (
      'invoices: read own or staff',
      'invoices: write (service_role)',
      'invoices: update (service_role)'
    );

  IF FOUND THEN
    DROP POLICY IF EXISTS "invoices: read own or staff" ON storage.objects;
    DROP POLICY IF EXISTS "invoices: write (service_role)" ON storage.objects;
    DROP POLICY IF EXISTS "invoices: update (service_role)" ON storage.objects;
  END IF;
END $$;

-- Read access: subscription owner or staff
CREATE POLICY "invoices: read own or staff"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoices'
  AND (
    app.is_staff()
    OR EXISTS (
      SELECT 1
      FROM public.invoices i
      JOIN public.subscriptions s
        ON s.id = i.subscription_id
      WHERE i.pdf_path = storage.objects.name
        AND s.user_id = auth.uid()
    )
  )
);

-- Write access: only service_role (uploads from Edge Functions)
CREATE POLICY "invoices: write (service_role)"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invoices'
  AND auth.role() = 'service_role'
);

CREATE POLICY "invoices: update (service_role)"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'invoices'
  AND auth.role() = 'service_role'
)
WITH CHECK (
  bucket_id = 'invoices'
  AND auth.role() = 'service_role'
);

