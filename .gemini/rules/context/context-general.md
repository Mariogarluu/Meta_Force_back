# Contexto General: Meta-Force (Ecosistema de Gimnasios)

## ¿Qué es?
Meta-Force es una plataforma integral de gestión para centros deportivos y gimnasios. Permite la administración de usuarios, rutinas de entrenamiento, planes de dieta, y el seguimiento de rendimiento mediante gráficas avanzadas e inteligencia artificial.

## Stack Tecnológico Principal
- **Frontend**: Angular (v17+)
    - **Estado**: Angular Signals para reactividad, RxJS para flujos asíncronos.
    - **Estilos**: SCSS + Vanilla CSS (Aesthetic Premium).
    - **Enrutamiento**: Angular Router organizado por módulos en `/src/app/pages/`.
- **Backend**: Supabase Native (Arquitectura Serverless)
    - **Edge Functions**: Escritas en TypeScript ejecutadas sobre Deno en `/supabase/functions/`.
    - **Base de Datos**: PostgreSQL gestionado mediante migraciones SQL nativas en `/supabase/migrations/`.
    - **Autenticación**: Supabase Auth con integración nativa en el frontend.
    - **Storage**: Gestión de imágenes/perfiles en Supabase Storage buckets.

## Reglas de Arquitectura
1. **Lógica de Negocio en Back**: La lógica pesada o sensible debe residir en las Edge Functions de Supabase.
2. **Reactividad por Señales**: En el frontend, priorizar `Signal` sobre `BehaviorSubject` para el estado interno de componentes.
3. **Internacionalización (i18n)**: Todo texto visible debe estar en los archivos JSON de traducciones (`/public/assets/i18n/`).
