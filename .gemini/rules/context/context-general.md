# Contexto General: Meta-Force (Ecosistema de Gimnasios)

## Ecosistema Meta-Force
Meta-Force es una plataforma multi-plataforma distribuida en los siguientes repositorios:
- **Backend/Web**: Angular + Supabase (este repositorio).
- **Mobile Nativo**: Android/Kotlin (repositorio `Meta-force-kotlin`).

## Stack Tecnológico Principal
- **Frontend Web**: Angular (v17+) con Signals y SCSS.
- **Backend**: Supabase Native (Edge Functions & Postgres).
- **Mobile Core**: Kotlin Nativo, CameraX, Room Database.

## Reglas de Arquitectura
1. **Lógica de Negocio en Back**: La lógica pesada o sensible debe residir en las Edge Functions de Supabase.
2. **Reactividad por Señales**: En el frontend, priorizar `Signal` sobre `BehaviorSubject` para el estado interno de componentes.
3. **Internacionalización (i18n)**: Todo texto visible debe estar en los archivos JSON de traducciones (`/public/assets/i18n/`).
