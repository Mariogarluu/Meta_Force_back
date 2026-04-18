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

1. Migraciones del directorio raíz `supabase/migrations/` en la raíz del monorepo (perfiles, RLS, storage).
2. Migraciones adicionales en `back/supabase/migrations/` (fases del plan y parches).

## API HTTP legacy

- Tras el sunset, las rutas `/api/*` en Vercel pueden responder **410** (ver `back/src/app-sunset.ts`).
