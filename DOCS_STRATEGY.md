# 🚀 Estrategia de Actividad y Documentación - Meta-Force

Este documento sirve como hoja de ruta para el "inflado profesional" del repositorio mediante documentación técnica de alto valor.

## 📊 Inventario Actual del Proyecto

| Repositorio | Archivos TypeScript (.ts) | Potencial de Commits | Líneas Estimadas |
| :--- | :---: | :---: | :---: |
| **Backend** | 87 | ~15 a 18 | +2,000 |
| **Frontend** | 78 | ~13 a 16 | +1,800 |
| **TOTAL** | **165** | **~30 a 34** | **~3,800+** |

---

## 🛠️ Plan de Ejecución (Sugerido)

Podemos ejecutar esto en "sesiones de documentación" agrupadas por módulos:

### Fase 1: Servicios e Infraestructura (Máximo Impacto)
- **Backend**: Auth, Users, AI, Prisma Config, Utils.
- **Frontend**: Auth Service, API Service, Theme/Lang services.
- *Objetivo*: Documentar la lógica de negocio central.

### Fase 2: Controladores e Interfaz (Visibilidad)
- **Backend**: Controllers de cada módulo, Routes, Esquemas de validación Zod.
- **Frontend**: Componentes de páginas (Performance, Dashboard, Home).
- *Objetivo*: Documentar cómo se exponen y consumen los datos.

### Fase 3: Componentes Compartidos y Tipado
- **Backend**: Tipos globales, Enums, DTOs.
- **Frontend**: UI Components (`Shared/components`), Guards, Interceptors.
- *Objetivo*: Documentar la estructura de datos y seguridad.

---

## ✍️ Estándares de Documentación (JSDoc Premium)

El usuario ha especificado estrictamente el siguiente formato para *todos* los archivos:

1. **Cabecera obligatoria al principio del archivo**, antes de la clase o servicio principal, definiendo la finalidad global:
   ```typescript
   /**
    * =============================================================================
    * TÍTULO DEL ARCHIVO/MÓDULO
    * =============================================================================
    * Descripción general y propósito en el ecosistema.
    * 
    * Responsabilidades:
    * 1. 
    * 2.
    * ...
    */
   ```
2. **JSDoc antes de cada apertura de llave `{}`** (justo encima de la firma de cada función, método o getters). 
   ```typescript
   /**
    * [Explicación de qué hace esta función y su flujo]
    * @param [nombre] - [Propósito]
    * @returns [Lo que devuelve]
    */
   ```
3. **Ningún comentario en línea (`//`) dentro de la lógica del propio bloque `{}`.** Salvo en excepciones matemáticas estrictas, el "qué y cómo" se expresa en la firma exterior.

---

## ✅ Registro de Progreso

| Fecha | Repositorio | Carpeta / Archivos | Estado |
| :--- | :--- | :--- | :---: |
| 19/04/2026 | **Frontend** | `src/app/core/services/` (Auth, Supabase, Notification, Theme, Users) | 🟢 5/18 |
| 19/04/2026 | **Backend** | `supabase/functions/` (Core Utils, Health, Register) | 🟢 5/20 |
| 21/04/2026 | **Backend** | `supabase/functions/` (access-scan, ai-chat, ai-save-plan, ai-sessions, machines-create) | 🟢 10/20 |
| 21/04/2026 | **Frontend** | `src/app/pages/login`, `dashboard`, `diets.service.ts` (Comentarios internos explicativos y traducción a español) | 🟢 8/18 |
| 23/04/2026 | **Backend** | `supabase/functions/` (auth-change-password, bulk-import, create-ticket) | 🟢 13/20 |
| 23/04/2026 | **Frontend** | `src/app/core/services/` (centers, classes, machines) | 🟢 11/18 |

---

## 📝 Notas de Git
- **Commit Size**: 5-8 archivos modificados por commit para maximizar la visibilidad en el historial.
- **Mensajes**: Siempre en español con prefijos claros (`docs:`, `style:`, `refactor:`).
- **Sincronización**: Realizar cambios simétricos en Front y Back para mantener coherencia de actividad.
