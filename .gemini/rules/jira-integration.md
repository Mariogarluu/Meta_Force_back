# Gestión de Jira en Meta-Force

## Trazabilidad con SCRUM-XX

Todo commit, comentario de código o actualización de tarea debe estar estrictamente vinculado a una clave de Jira del proyecto Meta-Force (Proyecto: SCRUM).

**Dominio**: `https://meta-force.atlassian.net`

**Formato de Commit**: `<tipo>(SCRUM-XX): <descripción>`
Ejemplos: 
- `feat(SCRUM-12): implementar login con supabase`
- `fix(SCRUM-45): corregir cálculo de rendimiento en el front`
- `docs(SCRUM-09): documentar servicios core`

### Instrucciones para Gemini:
1. **Verificación de Ticket**: Al iniciar una tarea, pide o busca siempre el ID del ticket de Jira relevante si no lo encuentras en el contexto inmediato.
2. **Registro de Trabajo**: Utiliza las herramientas de MCP de Atlassian para dejar comentarios en los tickets indicando el progreso o los archivos modificados.
3. **Menciones**: En los archivos JSDoc, siempre que sea posible, incluye una nota `@see [SCRUM-XX]` para referenciar la historia de usuario vinculante.
