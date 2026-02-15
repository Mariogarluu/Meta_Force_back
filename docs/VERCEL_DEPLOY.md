# Despliegue en Vercel con Render PostgreSQL

## Problema: P3018 - Migración fallida (MachineType no existe)

Si ves `relation "MachineType" does not exist` en la migración `20250120000000_add_workouts_and_diets`:

1. **Marcar la migración como revertida** (para poder reintentarla):
   ```bash
   cd back
   DATABASE_URL="postgresql://..." npx prisma migrate resolve --rolled-back 20250120000000_add_workouts_and_diets
   ```

2. **Volver a ejecutar migraciones**:
   ```bash
   npx prisma migrate deploy
   ```

La migración fue corregida para no añadir la FK a `MachineType` antes de que exista (se añade en migraciones posteriores).

---

## Problema: P1017 "Server has closed the connection"

Al desplegar en Vercel con base de datos en Render (Frankfurt), `prisma migrate deploy` suele fallar durante el build con:

```
Error: P1017: Server has closed the connection
```

**Causa**: Render PostgreSQL está en Frankfurt; los builds de Vercel en Washington DC. Conexiones cross-region y DB en estado "frío" provocan timeouts.

## Solución aplicada

Las migraciones **no se ejecutan durante el build de Vercel**. El build omite `prisma migrate deploy` cuando detecta `VERCEL=1`.

### Cómo aplicar migraciones nuevas

Antes de desplegar (o tras crear migraciones), ejecuta:

```bash
# Con DATABASE_URL en .env o en entorno:
npx prisma migrate deploy

# O con variable inline (producción):
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public" npx prisma migrate deploy
```

**Cuándo hacerlo**:
- Después de crear una migración con `npm run prisma:migrate -- --name nombre_migracion`
- Antes de hacer push a la rama que despliega Vercel
- O desde GitHub Actions (ver abajo)

### Opción: GitHub Actions

Crea `.github/workflows/migrate.yml`:

```yaml
name: Prisma Migrate

on:
  push:
    branches: [Mario]
    paths:
      - 'back/prisma/migrations/**'
      - 'back/prisma/schema.prisma'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: back/package-lock.json
      - run: npm ci
        working-directory: back
      - run: npx prisma migrate deploy
        working-directory: back
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

Añade `DATABASE_URL` como secret en GitHub (Settings → Secrets).

## Variables de entorno en Vercel

Configura en el proyecto de Vercel:

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `DATABASE_URL` | ✅ | URL de conexión a PostgreSQL (Render) |
| `JWT_SECRET` | ✅ | Al menos 32 caracteres |
| `FRONTEND_URL` | Recomendada | URL del frontend para CORS |

## Referencias

- [Prisma + Vercel](https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel)
- [Render PostgreSQL External URL](https://render.com/docs/databases#connection-pooling)
