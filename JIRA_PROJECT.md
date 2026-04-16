# Seguimiento de Proyecto Final - Meta-Force (JIRA)

Este archivo centraliza el estado actual de todas las tareas definidas en el backlog organizado por Sprints. Se actualizará conforme avancemos en el desarrollo.

## 🚀 Sprint 6 (Finalizado)
### SCRUM-131 Optimización de Rendimiento (Backend) [12 pts]
*Implementación de un módulo dedicado para el monitoreo y análisis del rendimiento de la API.*
- [x] Implementar el nuevo módulo de Performance (Controller, Routes, Service).
- [x] Integrar lógicas de medición de rendimiento en la aplicación.
- [x] Implementar la interfaz de usuario de Rendimiento (Gráficas y formularios).
- [x] Corregir conexión Frontend-Backend local y error 500 (userId).
- [x] Internacionalización del módulo (ES, EN, FR) - **COMPLETO**.

---

## 🏗️ Sprint 7 (En Curso)
### SCRUM-126 Documentación y Ciberseguridad (parte 2) [10 pts]
- [ ] Auditar de nuevo la aplicación con Zap.
- [ ] Mejorar la app con los resultados de la auditoría.
- [ ] Auditar el módulo de Kotlin.
- [x] Documentar con Compodoc (Objetivo 100%).
- [/] Auditoría y corrección de traducciones global.

### SCRUM-106 Modo Offline y Persistencia (Room) [14 pts]
- [x] Configuración de la base de datos Room.
- [x] Creación de Entidades (User, Workout, Diet).
- [x] Implementación de DAOs para acceso local.
- [x] Cacheado de respuestas de red en la DB para acceso offline.

### SCRUM-138 Infraestructura y Despliegue [20 pts]
- [ ] Migración de la base de datos a Supabase.
- [ ] Optimización de despliegue en Vercel/Render.

---

## 📊 Sprint 8 (Próximo)
### SCRUM-121 Gestionar bien Datos del usuario [18 pts]
- [x] Progreso del usuario (Campos `activityLevel` y `goal` añadidos en BD).
- [x] Panel visual de evolución física en el frontend.
- [ ] Tablas con Power BI.
- [ ] Extracción de datos con Pandas.

### SCRUM-18 Sistema de Facturación [11 pts]
- [ ] Implementar la interfaz de usuario para la facturación.
- [ ] Implementar la gestión de productos y servicios.
- [ ] Integrar la funcionalidad de gestión de clientes.
- [ ] Desarrollar la lógica de generación de facturas.
- [ ] Configurar la exportación e impresión de facturas (PDF).

---

## 🛠️ Sprint 9 (Backup)
### SCRUM-99 Funciones Propias de Dispositivo y UI [18 pts]
- [x] Generador de Código QR para acceso a centros.
- [x] Chat de IA (Gemini/OpenAI) para consultas rápidas.
- [x] Selector de fotos de perfil desde la Galería.
- [ ] Captura de fotos directa usando CameraX.
- [ ] Guardado y gestión con MediaStore.
- [x] Manejo de Permisos en Runtime.

### SCRUM-111 Tareas en Segundo Plano y Alertas [10 pts]
- [/] Configuración de WorkManager.
- [ ] Implementación de Notificaciones push/locales.

---
**Última actualización**: 16 de abril de 2026.
