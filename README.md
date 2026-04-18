# Meta-Force — Supabase (backend)

Este repositorio contiene **únicamente** el proyecto Supabase del producto:

- `supabase/migrations/` — historial SQL aplicado con `supabase db push`
- `supabase/functions/` — Edge Functions (Auth auxiliar, IA, tickets, importaciones, etc.)

La API **Express + Prisma + despliegue Vercel** quedó archivada en el tag git **`pre-supabase`**.

## Requisitos

- [Supabase CLI](https://supabase.com/docs/guides/cli) (o `npx supabase@2.90.0`)
- Cuenta Supabase y proyecto enlazado (`supabase link`)

## Comandos útiles

```bash
npm install
npx supabase db push              # aplicar migraciones pendientes al remoto enlazado
npx supabase migration list --linked
npm run functions:deploy          # requiere `supabase` en PATH o usar npx
```

Ver [SECRETS.md](SECRETS.md) para variables de Edge Functions y rotación de claves.

## Verificación (local)

Tras rellenar `.env` con `DATABASE_URL` válida (o ejecutar `npx supabase link --project-ref <TU_PROJECT_REF> -p <db_password>`):

```bash
npx supabase migration list --linked
npx supabase db advisors --linked   # requiere CLI reciente
```

Build del front (Angular): `npx ng build` en el repo del front.

**Vercel:** borra el proyecto `meta-force-back` en el dashboard si aún existe (el dominio puede seguir respondiendo con error hasta entonces).

## Documentación histórica

- Decisiones de migración: [docs/MIGRATION_DECISIONS.md](docs/MIGRATION_DECISIONS.md)
