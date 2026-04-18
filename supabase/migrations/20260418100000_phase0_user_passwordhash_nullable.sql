-- Phase 0: allow rows created only from Supabase Auth trigger without legacy password.
-- Safe if column is already nullable.

ALTER TABLE public."User"
  ALTER COLUMN "passwordHash" DROP NOT NULL;

COMMENT ON COLUMN public."User"."passwordHash" IS 'Legacy Express auth; null when user exists only via Supabase Auth.';
