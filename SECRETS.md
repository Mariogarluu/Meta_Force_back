# Secretos y variables (Edge Functions)

Configura en el **Dashboard de Supabase** → *Project Settings* → *Edge Functions* → *Secrets*, o con CLI desde esta carpeta:

```bash
npx supabase secrets set GEMINI_API_KEY=tu_clave
npx supabase secrets set CORS_ORIGIN=https://tu-dominio-front.vercel.app
npx supabase secrets set MIGRATE_SECRET=valor_largo_aleatorio   # solo para migrate-legacy-users
```

## Referencia rápida

| Secreto | Uso |
|--------|-----|
| `GEMINI_API_KEY` | Funciones `ai-chat`, `ai-sessions`, `ai-save-plan` (vía `_shared/gemini.ts`) |
| `GEMINI_MODEL` | Opcional; por defecto usa el modelo definido en código |
| `CORS_ORIGIN` | Origen permitido CORS en Edge (`_shared/cors.ts`; si falta puede usarse `*`) |
| `MIGRATE_SECRET` | Header `x-migrate-secret` en `migrate-legacy-users` |

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` las inyecta la plataforma en runtime; **no** las pegues en el repo.

## Rotación (si `.env` llegó a versionarse o filtrarse)

1. **Postgres**: *Settings* → *Database* → cambiar contraseña del usuario `postgres` / pooler.
2. **Anon / service_role**: *Settings* → *API* → rotar claves si procede.
3. **Google AI Studio**: revocar y crear nueva `GEMINI_API_KEY`.
4. **Cloudinary** (si aún lo usas en otro servicio): rotar desde su panel.

Copia valores nuevos solo a `.env` local (ignorado por git) o a *Secrets* de Supabase, nunca a commits.
