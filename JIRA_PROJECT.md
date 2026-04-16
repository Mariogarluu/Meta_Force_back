# Seguimiento de Proyecto Final - Meta-Force

Este archivo centraliza el estado actual de todas las tareas definidas en Jira. Se actualizará conforme avancemos en el desarrollo.

## 1. Optimización de Rendimiento (Backend)
*Implementación de un módulo dedicado para el monitoreo y análisis del rendimiento de la API.*
- [x] Implementar el nuevo módulo de Performance (Controller, Routes, Service).
- [x] Integrar lógicas de medición de rendimiento en la aplicación.
- [x] Implementar la interfaz de usuario de Rendimiento (Gráficas y formularios).
- [x] Corregir conexión Frontend-Backend local y error 500 (userId).

## 2. Documentación y Ciberseguridad (Parte 2)
*Ampliación de la seguridad mediante auditorías OWASP ZAP y documentación técnica exhaustiva.*
- [ ] Auditar de nuevo la aplicación con Zap.
- [ ] Mejorar la app con los resultados de la auditoría.
- [ ] Auditar el módulo de Kotlin.
- [/] Documentar con Compodoc (Objetivo 100%). *(Nota: Carpeta existente, verificar cobertura)*.

## 3. Modo Offline y Persistencia (Room - Kotlin)
*Garantizar que la aplicación funcione sin conexión (Offline First) con base de datos local.*
- [x] Configuración de la base de datos Room.
- [x] Creación de Entidades (User, Workout, Diet).
- [x] Implementación de DAOs para acceso local.
- [x] Cacheado de respuestas de red en la DB para acceso offline.

## 4. Gestionar Datos del Usuario
*Análisis avanzado del progreso y nivel de actividad del usuario mediante herramientas de datos.*
- [x] Progreso del usuario (Campos `activityLevel` y `goal` añadidos en BD).
- [x] Panel visual de evolución física en el frontend.
- [ ] Tablas con Power BI.
- [ ] Extracción de datos con Pandas.

## 5. Sistema de Facturación
*Módulo integral para la gestión comercial, cobros y exportación de facturas.*
- [ ] Implementar la interfaz de usuario para la facturación.
- [ ] Implementar la gestión de productos y servicios.
- [ ] Integrar la funcionalidad de gestión de clientes.
- [ ] Desarrollar la lógica de generación de facturas.
- [ ] Diseñar la base de datos para el sistema de facturación.
- [ ] Configurar la exportación e impresión de facturas.
- [ ] Agregar validaciones y control de errores en la facturación.

## 6. Funciones Propias de Dispositivo y UI (Kotlin)
*Uso de hardware móvil y Material 3 para mejorar la experiencia de usuario.*
- [x] Generador de Código QR para acceso a centros.
- [x] Chat de IA (Gemini/OpenAI) para consultas rápidas.
- [x] Selector de fotos de perfil desde la Galería.
- [ ] Captura de fotos directa usando CameraX.
- [ ] Guardado y gestión con MediaStore.
- [x] Manejo de Permisos en Runtime.

## 7. Tareas en Segundo Plano y Alertas (Kotlin)
*Sincronización y notificaciones incluso con la app cerrada.*
- [/] Configuración de WorkManager.
- [ ] Implementación de Notificaciones push/locales.

---
**Última actualización**: 16 de abril de 2026.
