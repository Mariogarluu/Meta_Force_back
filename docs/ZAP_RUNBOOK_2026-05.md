# OWASP ZAP — Runbook Meta-Force (2026-05)

Este runbook describe cómo ejecutar la re-auditoría de ciberseguridad del SCRUM-126
usando OWASP ZAP sobre la arquitectura actual (Supabase + Frontend Vercel).

## 1. Contexto y alcance

- Frontend: `https://meta-force.vercel.app`
- Supabase Edge Functions: `https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/*`
- Supabase REST (PostgREST): `https://<YOUR_PROJECT_REF>.supabase.co/rest/v1/*`

Archivos de apoyo en el repo:

- `back/zap/context-meta-force.context` → lista de targets y notas de autenticación.
- `back/Ciberseguridad-back.md` → auditoría anterior (Express, obsoleto).

## 2. Preparación en ZAP (UI)

1. Abrir OWASP ZAP (versión estable reciente).
2. Crear un nuevo contexto `meta-force`:
   - Tools → Options → Session Properties → Contexts → New.
   - Añadir patrones de inclusión:
     - `https://meta-force.vercel.app/.*`
     - `https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/.*`
     - `https://<YOUR_PROJECT_REF>.supabase.co/rest/v1/.*`
3. Configurar autenticación (HTTP Header Auth):
   - En el contexto `meta-force`, pestaña Authentication:
     - Tipo: HTTP Authentication.
     - Header: `Authorization`
     - Value: `Bearer <TOKEN>`
   - Crear 2 usuarios dentro del contexto:
     - `user_standard` → token JWT de usuario con rol `USER`.
     - `user_admin` → token JWT de usuario con rol `ADMIN`.

## 3. Spider + Active Scan

### 3.1 Spider (reconocimiento)

Por cada usuario (USER y ADMIN):

1. Botón derecho sobre el contexto `meta-force` → `Attack` → `Spider...`.
2. Seleccionar el usuario correspondiente en el desplegable.
3. Dejar que el spider recorra toda la aplicación.

### 3.2 Active Scan

1. Botón derecho sobre el contexto `meta-force` → `Attack` → `Active Scan...`.
2. Seleccionar primero `user_standard` y ejecutar el escaneo completo.
3. Repetir el proceso con `user_admin`.

## 4. Comprobaciones específicas Supabase

Durante el análisis de resultados, prestar especial atención a:

- **Bypass de RLS**
  - Intentos de acceso a recursos de otros usuarios (por ejemplo, cambiando IDs
    en rutas o parámetros de `Workout`, `Diet`, `Ticket`, etc.).
- **Exposición de claves**
  - Verificar que en ninguna respuesta aparece el valor de `service_role` ni
    secretos de Supabase.
- **Cabeceras de seguridad**
  - Comprobar presencia de:
    - `X-Content-Type-Options: nosniff`
    - `Referrer-Policy`
    - `Permissions-Policy`
- **CORS**
  - Orígenes permitidos coherentes con `meta-force.vercel.app` y dominios de desarrollo.

## 5. Exportar resultados

1. Tras finalizar el Active Scan, ir a:
   - `Report` → `Generate Report...`
2. Generar:
   - Un informe HTML.
   - Un informe JSON/XML si se quiere procesar automáticamente.
3. Guardar los ficheros exportados en una carpeta local (no se versionan por
   defecto en el repo; se resumen en `back/docs/security-audit-2026-05.md`).

## 6. Volcado a `security-audit-2026-05.md`

Usar la plantilla en `back/docs/security-audit-2026-05.md` para:

- Listar hallazgos ordenados por severidad (High, Medium, Low, Informational).
- Documentar:
  - Endpoint o recurso afectado.
  - Descripción resumida.
  - Riesgo e impacto.
  - Recomendación.
  - Estado: `OPEN`, `IN_PROGRESS`, `FIXED`.

