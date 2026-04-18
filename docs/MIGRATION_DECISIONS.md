# Decisiones de migración Express → Supabase (Meta-force)

## Identidad y roles

- **Fuente de verdad**: `auth.users` (Supabase Auth).
- **Perfil de negocio**: `public.profiles` (PK = `auth.users.id`) con `role` y `status` tipo enum Prisma (`Role`, `UserStatus`).
- **Tabla legacy**: `public."User"` enlazada con `auth_user_id uuid` (estrategia **B** del plan: conservar `id` texto donde haga falta y alinear nuevos registros con `id = auth.users.id::text`).
- **JWT de aplicación propia (`JWT_SECRET`)**: en desuso para clientes nuevos; las Edge `ai-*` pasan a `verify_jwt = true` (JWT emitido por Supabase).

## Storage

- **Avatares**: bucket existente `profiles` (no se crea bucket duplicado `avatars`).
- **Tickets**: bucket `tickets` (ya definido en migraciones raíz); uploads desde Edge `create-ticket` con service role.

## Orden de aplicación de SQL

Todo el historial SQL vive en **`supabase/migrations/`** de este repo (antes parte estaba en la raíz del monorepo; se unificó aquí). Aplicar con `npx supabase db push` desde la raíz del repo `back/`.

## API HTTP legacy

- Express/Vercel retirados; snapshot en tag git **`pre-supabase`**. El cliente usa solo Supabase (Auth, PostgREST, Edge Functions).
