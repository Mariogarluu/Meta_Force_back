# Contexto de Módulo: Supabase Native (Backend)

## Estructura del Servidor Edge
El backend de Meta-Force utiliza Supabase Edge Functions, lo que permite ejecutar lógica de servidor en TypeScript/Deno de forma distribuida.

### Directorios Clave
- **`/supabase/functions/`**: Contiene las carpetas de cada Edge Function. Cada carpeta debe tener un archivo `index.ts`.
- **`/supabase/functions/_shared/`**: Lógica compartida entre funciones (motores de IA, clientes admin, CORS).
- **`/supabase/migrations/`**: Historial de cambios en la base de datos PostgreSQL. Utiliza SQL estándar.

## Reglas de Implementación
1. **Deno.serve**: Todas las funciones deben exportar un manejador mediante `Deno.serve`.
2. **Seguridad**: Nunca exponer la `SERVICE_ROLE_KEY`. Utilizar `getSupabaseAdmin()` desde `_shared` para operaciones sensibles.
3. **Manejo de Errores**: Retornar siempre respuestas JSON coherentes usando `jsonResponse(body, status)` establecido en las utilidades de CORS compartidas.
4. **Despliegue**: Los cambios se sincronizan mediante `supabase functions deploy [nombre]`.

## Integración con Frontend
El frontend consume estas funciones directamente mediante el cliente de Supabase instanciado en `SupabaseService`.
