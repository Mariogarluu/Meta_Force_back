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

Cada función debe seguir este formato para garantizar la máxima calidad:

```typescript
/**
 * [Descripción breve de la acción en español]
 * 
 * [Explicación detallada de la lógica interna o efectos secundarios]
 * 
 * @param [nombre] - [Propósito del parámetro]
 * @returns [Descripción de lo que devuelve la promesa/función]
 * @throws [Errores esperados/excepciones]
 */
```

---

## ✅ Registro de Progreso

| Fecha | Repositorio | Carpeta / Archivos | Estado |
| :--- | :--- | :--- | :---: |
| 19/04/2026 | **Frontend** | `src/app/core/services/` (Auth, Supabase, Notification, Theme, Users) | 🟢 5/18 |
| | | | |

---

## 📝 Notas de Git
- **Commit Size**: 5-8 archivos modificados por commit para maximizar la visibilidad en el historial.
- **Mensajes**: Siempre en español con prefijos claros (`docs:`, `style:`, `refactor:`).
- **Sincronización**: Realizar cambios simétricos en Front y Back para mantener coherencia de actividad.
