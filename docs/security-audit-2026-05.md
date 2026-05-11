# Auditoría de Ciberseguridad 2026-05 — Meta-Force (Supabase + Frontend)

> Este documento sustituye a `Ciberseguridad-back.md`, que describía la
> arquitectura antigua basada en Express. Aquí se registran únicamente
> hallazgos sobre la plataforma actual (Supabase Auth + PostgREST +
> Edge Functions + Frontend Vercel).

## 1. Contexto de la auditoría

- Fecha de ejecución de ZAP: `YYYY-MM-DD` (rellenar tras la pasada real).
- Herramienta: OWASP ZAP (versión estable 2026).
- Alcance:
  - `https://meta-force.vercel.app`
  - `https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/*`
  - `https://<YOUR_PROJECT_REF>.supabase.co/rest/v1/*`
- Usuarios de prueba:
  - `USER` con permisos estándar.
  - `ADMIN` con permisos de administración.

## 2. Resumen ejecutivo

Completar tras la auditoría:

- Número total de hallazgos High / Medium / Low / Info.
- Si se han detectado bypasses de RLS.
- Si se han detectado exposiciones de claves o datos sensibles.
- Estado global: `ACEPTABLE` / `RIESGO MODERADO` / `RIESGO ALTO`.

## 3. Matriz de hallazgos

| ID | Severidad | Componente              | Descripción breve                         | Estado       |
|----|-----------|-------------------------|-------------------------------------------|-------------|
| H-1| HIGH      | Auth / Supabase         | Ejemplo: Bypass de RLS en Workout         | OPEN        |
| M-1| MEDIUM    | Frontend / Cookies      | Ejemplo: Falta `SameSite` en cookie X     | IN_PROGRESS |
| L-1| LOW       | Headers                 | Ejemplo: Falta `Referrer-Policy`         | FIXED       |

> NOTA: Rellenar con los hallazgos reales exportados desde ZAP.

## 4. Detalle de hallazgos (plantilla)

### ID: H-1 — Título del hallazgo

- **Severidad**: HIGH  
- **Componente**: (Auth / Edge Function / REST / Frontend / Storage)  
- **Descripción**:  
  Describir el problema tal y como aparece en el informe de ZAP,
  incluyendo ejemplos de peticiones y respuestas si son relevantes.

- **Riesgo e impacto**:  
  Explicar qué puede conseguir un atacante explotando la vulnerabilidad
  (por ejemplo, leer datos de otros usuarios, modificar registros, etc.).

- **Recomendación**:  
  - Ejemplo para RLS:
    - Revisar las políticas RLS de la tabla afectada.
    - Asegurar que todas las operaciones (`SELECT`, `INSERT`, `UPDATE`,
      `DELETE`) utilizan `auth.uid()` o `auth.jwt()` de manera segura.
  - Ejemplo para cabeceras:
    - Añadir `X-Content-Type-Options: nosniff`.
    - Configurar `Referrer-Policy: strict-origin-when-cross-origin`.

- **Estado**: `OPEN` / `IN_PROGRESS` / `FIXED`  
- **Fecha de resolución** (si aplica): `YYYY-MM-DD`  
- **Commits / PRs relacionados**: enlaces a ramas o PRs donde se resuelve.

---

Repetir la sección anterior (ID: M-1, L-1, etc.) por cada hallazgo relevante.

## 5. Checklist de endurecimiento aplicado

Marcar con `x` cuando se haya aplicado cada mejora:

- [ ] Rate limiting implementado en Edge Functions sensibles (`auth-register`, `ai-chat`, `create-ticket`).
- [ ] Cabeceras de seguridad añadidas en helper de respuesta (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).
- [ ] Revisión de RLS completada para todas las tablas de negocio.
- [ ] Auditoría estática del módulo Kotlin (`detekt`) sin hallazgos críticos abiertos.
- [ ] Auditoría móvil de APK (`MobSF`) sin hallazgos críticos abiertos.

## 6. Conclusión

Redactar un breve resumen final:

- Grado de exposición residual aceptado.
- Tareas de seguimiento pendientes (si las hubiera).
- Decisión sobre cierre del SCRUM-126 desde el punto de vista de ciberseguridad.

