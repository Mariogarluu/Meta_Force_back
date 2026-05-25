-- Tabla para eventos de rendimiento usados por la IA y la UI
CREATE TABLE IF NOT EXISTS public."PerformanceEvent" (
  id text PRIMARY KEY,
  "userId" text NOT NULL,
  kind text NOT NULL,
  severity text NOT NULL,
  payload jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "acknowledgedAt" timestamptz,
  "consumedByAiAt" timestamptz
);

CREATE INDEX IF NOT EXISTS "PerformanceEvent_userId_createdAt_idx"
  ON public."PerformanceEvent" ("userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "PerformanceEvent_userId_unacked_idx"
  ON public."PerformanceEvent" ("userId", "acknowledgedAt")
  WHERE "acknowledgedAt" IS NULL;

ALTER TABLE public."PerformanceEvent" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PerformanceEvent: select own" ON public."PerformanceEvent";
CREATE POLICY "PerformanceEvent: select own"
ON public."PerformanceEvent" FOR SELECT
USING (public.current_user_id_text() = "userId");

DROP POLICY IF EXISTS "PerformanceEvent: write own" ON public."PerformanceEvent";
CREATE POLICY "PerformanceEvent: write own"
ON public."PerformanceEvent" FOR ALL
USING (public.current_user_id_text() = "userId")
WITH CHECK (public.current_user_id_text() = "userId");

