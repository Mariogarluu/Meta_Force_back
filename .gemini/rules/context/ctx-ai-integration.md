# Contexto de Módulo: Inteligencia Artificial (Gemini Integration)

## Propósito
Meta-Force utiliza el modelo Gemini de Google para proporcionar asistencia inteligente a los usuarios, generando planes de entrenamiento personalizados, sugerencias de dieta y análisis de progreso.

## Flujo de Trabajo (Backend)
- **Localización**: `/supabase/functions/ai-chat/` y `/supabase/functions/ai-save-plan/`.
- **Motor**: Utiliza `callGemini()` definido en `_shared/gemini.ts`.
- **Secretos**: Requiere la variable de entorno `GEMINI_API_KEY` configurada en el proyecto de Supabase.

## Reglas de Prompts
1. **Instrucciones de Sistema**: Se deben definir instrucciones de sistema claras que posicionen a la IA como un "Entrenador de Meta-Force experto y motivador".
2. **Formato de Respuesta**: Se debe solicitar a la IA que responda siempre en formato JSON estructurado cuando se trate de planes, para que el frontend pueda renderizarlos correctamente.
3. **Historial**: El chat debe mantener un contexto de sesión utilizando la tabla `ai_sessions` de la base de datos para no perder el hilo de la conversación.

## Integración con Frontend
El frontend consume estas funciones a través de `AiService`, que maneja el envío de preguntas y la visualización del chat interactivo.
