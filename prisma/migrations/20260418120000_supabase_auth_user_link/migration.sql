-- Align Prisma history with Supabase migrations that may have already added auth_user_id.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "auth_user_id" UUID;
    CREATE UNIQUE INDEX "User_auth_user_id_key" ON "User"("auth_user_id");
  END IF;
END $$;

ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
