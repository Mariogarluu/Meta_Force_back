# Archivo lógico de la API Express

La implementación completa de Meta-force API (Express + Prisma) vive en **`back/src/`**.

Este directorio solo documenta el “archivo” conceptual tras la migración a Supabase:

- Autenticación cliente: **Supabase Auth** + tabla `profiles`.
- Datos: **PostgREST** + **RLS** (`supabase/migrations/` en la raíz del repo).
- Lógica extra: **Edge Functions** en `back/supabase/functions/`.

Para restaurar solo el backend Express de una revisión concreta del historial Git:

```bash
git checkout <commit-o-tag> -- back/src back/api back/prisma
```
