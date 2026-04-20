# Gestión de Git y Rama Principal en Meta-Force

## Flujo de Trabajo en Repositorios (Front & Back)

En Meta-Force el flujo de ramas es crítico para mantener la estabilidad del sistema nativo de Supabase y el SPA de Angular.

### Ramas Principales
- **`main`**: Rama de producción e integración final. Aquí se suben todos los cambios **ya arreglados y verificados** por el equipo. Es la rama de despliegue estable.
- **`Samuel`**: Rama de desarrollo personal y características activas. Es donde se preparan las subidas de documentación masiva y nuevas funcionalidades antes de integrarse en `main`.

### Reglas de Envío (Push)
1. **Sincronización Total**: Todo cambio que se aplique en `Samuel` debe ser verificado localmente antes de integrarse mediante `merge` en `main`.
2. **Push Simultáneo**: Para mantener la coherencia de actividad, los commits de documentación deben subirse tanto a `Samuel` como a `main` (vía merge/reset) de forma sincronizada.
3. **Mensajes Éticos**: Los mensajes de commit deben seguir la convención de `jira-integration.md` incluyendo siempre el ID de ticket `SCRUM-XX`.

### Sincronización entre Repositorios
Al realizar cambios en las Edge Functions del Backend, siempre se debe verificar si el Frontend requiere actualizaciones en los modelos o servicios correspondientes.
