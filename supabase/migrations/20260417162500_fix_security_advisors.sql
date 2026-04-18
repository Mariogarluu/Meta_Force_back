-- Fix remaining security advisors

-- 1) Move Prisma internal history table out of exposed `public` schema
CREATE SCHEMA IF NOT EXISTS prisma;
ALTER TABLE IF EXISTS public._prisma_migrations SET SCHEMA prisma;

-- 2) Tighten Ticket insert policy to prevent arbitrary inserts
DROP POLICY IF EXISTS "Ticket: insert (authenticated)" ON public."Ticket";
CREATE POLICY "Ticket: insert (authenticated)"
ON public."Ticket" FOR INSERT
TO authenticated
WITH CHECK (
  email = (auth.jwt() ->> 'email')
);

