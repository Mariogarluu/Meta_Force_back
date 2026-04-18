# Despliegue

El backend de aplicación es **Supabase** (Postgres + Edge Functions). No hay despliegue Node/Vercel en este repo.

- Migraciones: `npx supabase db push` (proyecto enlazado o `--db-url`).
- Funciones: `npm run functions:deploy` (requiere login CLI y proyecto enlazado).

Detalles: [README.md](README.md) y [SECRETS.md](SECRETS.md).
