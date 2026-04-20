# Contexto de Módulo: Rendimiento y Lógica Deportiva (Performance)

## Responsabilidades
Este módulo se encarga del seguimiento antropométrico y deportivo del usuario. Gestiona el registro de pesos, medidas corporales y la progresión en los entrenamientos.

## Tecnologías y Patrones (Frontend)
- **Componentes**: Ubicados en `/src/app/pages/performance/`.
- **Reactividad**: Basada puramente en Angular Signals para asegurar que la UI se actualice instantáneamente tras un registro.
- **Gráficas**: Uso de Chart.js / PrimeNG para visualizar la evolución histórica.
- **Modelos**: Reflejados en `/src/app/core/models/` (específicamente interfaces de pesos y progresos).

## Reglas de Desarrollo
1. **Validación de Datos**: Todo registro de peso o medida debe ser validado contra los rangos lógicos definidos en la interfaz.
2. **Cálculos en Tiempo Real**: El IMC y otros indicadores de salud deben ser calculados mediante `computed()` Signals.
3. **Notificaciones**: Al alcanzar un hito o completar una meta, disparar una notificación local mediante `NotificationService`.
