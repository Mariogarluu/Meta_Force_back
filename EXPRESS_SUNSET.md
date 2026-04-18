# Sunset de Express (`/api`)

## Variable `META_FORCE_API_MODE=supabase`

Si está definida en Vercel (o en `.env` local), el proceso carga [`src/supabase-sunset-app.ts`](src/supabase-sunset-app.ts): todas las rutas `/api/*` responden **410 Gone** con un JSON que indica usar Supabase.

Sin esa variable, se sigue cargando la API Express completa desde [`src/app.ts`](src/app.ts).

## Archivo de entrada

- Desarrollo local: [`src/index.ts`](src/index.ts) usa `app` o `sunsetApp` según la variable.
- Vercel serverless: [`api/index.ts`](api/index.ts) elige la misma lógica.

## Archivo del código Express “archivado”

El código legacy permanece en **`src/`** (controladores, servicios, Prisma). Para un snapshot histórico usa **git tags / branches**; no se duplicó una copia física en `archive/` para evitar divergencias.

## Migraciones SQL

- Raíz del monorepo: `supabase/migrations/` (perfiles, RLS, storage).
- Back: `back/supabase/migrations/` (parches adicionales del plan).
