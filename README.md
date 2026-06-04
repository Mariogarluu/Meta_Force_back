# Meta Force Backend — Supabase & Analytics 🏋️🔥

Este directorio contiene la arquitectura y el código de la infraestructura de backend de **Meta Force**, migrada de forma completa desde el histórico Express/Prisma hacia un entorno serverless moderno en **Supabase Cloud**. También aloja el pipeline ETL y el dashboard analítico de BI.

---

## 🌟 Arquitectura Serverless (Supabase)

El backend de Meta Force está diseñado bajo el principio de **defensa en profundidad** y se compone de:

1. **Base de Datos PostgreSQL**: 34 tablas completamente modeladas con políticas de seguridad **Row Level Security (RLS)** activas.
2. **Autenticación (Supabase Auth)**: Gestión de sesiones JWT robusta. Se ha implementado un **Custom Access Token Hook** en base de datos para inyectar el rol del usuario directamente en el token JWT, garantizando que el rol no sea manipulable por el cliente.
3. **Edge Functions (Deno / TypeScript)**: Lógica serverless de ejecución rápida en el borde para sustituir los servicios de Express (facturación, firma QR de acceso, chat IA y envío de correos).
4. **Storage**: Bucket `invoices` seguro para almacenar copias firmadas de las facturas de suscripciones de los socios.

---

## 📂 Estructura del Directorio Backend

```
back/
├── supabase/                    # Configuración y código Supabase
│   ├── config.toml              # Configuración local de CLI (puertos, JWT, auth)
│   ├── migrations/              # +25 Migraciones SQL versionadas
│   ├── functions/               # Edge Functions en TypeScript/Deno
│   │   ├── ai-chat/             # Integración con Groq (Llama-3) para planes
│   │   ├── qr-sign/             # Firmado con JWT corto para accesos físicos
│   │   ├── invoice-pdf/         # Generación asíncrona de facturas PDF
│   │   └── subscription-email/  # Despacho de emails transaccionales vía Resend
│   └── tests/                   # Pruebas SQL unitarias (pgTAP)
├── analytics/                   # Módulo analítico de BI
│   ├── extract_data.py          # Script ETL en Python (Pandas) contra Supabase
│   ├── requirements.txt         # Dependencias del script analítico
│   ├── exports/                 # Archivos CSV intermedios generados por el ETL
│   └── Power_Bi/                # Dashboard de Power BI Premium para Superadmin
├── docs/                        # Documentación técnica y runbooks
│   ├── MIGRATION_DECISIONS.md   # Registro de decisiones de migración
│   ├── security-audit-2026-05.md # Resultado de auditorías OWASP ZAP
│   └── ZAP_RUNBOOK_2026-05.md   # Instrucciones para reproducir escaneos ZAP
└── package.json                 # Tareas de administración y despliegue local
```

---

## ⚙️ Configuración y Variables de Entorno

Para levantar o desplegar el backend, crea un archivo `back/.env` (basado en `back/.env.example`) con las siguientes variables:

```ini
# Base de datos Supabase
DATABASE_URL="postgres://postgres.qybgnrlszozjhimewkel:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgres://postgres.qybgnrlszozjhimewkel:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# Edge Functions y Servicios Externos (SCRUM-18)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."
RESEND_API_KEY="re_..."
RESEND_FROM="Meta Force <facturacion@meta-force-gym.com>"
JWT_QR_SECRET="secreto_firma_qr_super_seguro"
```

---

## 🛠️ Desarrollo en Local con Supabase CLI

1. **Requisito**: Tener instalado Docker y Supabase CLI (`npm install -g supabase`).
2. **Iniciar base de datos local**:
   ```bash
   npx supabase start
   ```
3. **Aplicar migraciones SQL**:
   ```bash
   npx supabase db push
   ```
4. **Ejecutar pruebas unitarias SQL (pgTAP)**:
   ```bash
   npx supabase test db
   ```
5. **Desplegar Edge Functions a Producción**:
   ```bash
   npx supabase functions deploy
   ```

---

## 🛡️ Hardening de Seguridad de Roles (JWT claims)

La base de datos ya no confía en la columna `role` editable en `public.profiles` para autorizar peticiones:

1. Se crea la tabla maestra `public.user_roles`.
2. Al generar un JWT, Supabase invoca la función Postgres `public.custom_access_token_hook(event jsonb)` la cual añade el rol verificado como la claim `app_role` firmada.
3. Las políticas RLS evalúan los permisos llamando a `auth.jwt()->>'app_role'`. Si un usuario intenta modificar su rol en local, el token será inválido o rechazado, neutralizando cualquier auto-escalado de privilegios.

---

## 📊 Analytics & Business Intelligence (BI)

El panel ejecutivo Superadmin se alimenta mediante un flujo de extracción estructurado:

1. **ETL con Python**:
   El script [extract_data.py](file:///c:/Users/mario/Desktop/Programacion/DAM/Meta-force/back/analytics/extract_data.py) se conecta a la API de Supabase, extrae las tablas principales (`User`, `subscriptions`, `invoices`, etc.) y aplica transformaciones de datos usando Pandas.
   
   Ejecución del ETL:
   ```bash
   cd analytics
   pip install -r requirements.txt
   python extract_data.py
   ```
   *Salida*: Ficheros CSV formateados en `back/analytics/exports/`.

2. **Visualización en Power BI**:
   El archivo `MetaForce_Superadmin_Dashboard.pbix` lee los CSV generados por el ETL para renderizar las métricas financieras (MRR, facturación total), ratios de retención, ocupación por centro y distribución de planes contratados.

---

## 🧪 Pruebas de Calidad

* **SQL Unit Tests**: Se localizan en `back/supabase/tests/`. Evalúan:
  * `invoice_numbering.test.sql`: Garantiza numeración secuencial libre de colisiones.
  * `role_isolation.test.sql`: Valida el aislamiento estricto RLS por rol de base de datos.
* **E2E Smoke Tests**: Archivo `back/tests/e2e/role-hardening.smoke.mjs` escrito en Node para simular vectores de ataque contra los endpoints de Supabase.
