# 📖 Documentación del Proyecto: Meta-Force Backend

Aquí llevamos el registro de qué hemos hecho en cada parte del sistema para que el equipo esté alineado.

## ⚙️ Core & Configuración
*   **`.env`**: Aquí hemos guardado todas las llaves maestras del proyecto (Supabase, Cloudinary, Gemini). Es el corazón de la configuración y lo mantenemos fuera de GitHub por seguridad.
*   **`prisma/schema.prisma`**: Aquí hemos definido nuestra arquitectura de base de datos. Usamos modelos claros para `User`, `Exercise` y `BodyWeightRecord`, estableciendo las relaciones necesarias para que todo el sistema de seguimiento funcione perfecto.
*   **`package.json`**: Aquí hemos organizado todas las dependencias de Node.js. Hemos incluido Express para el servidor y Prisma para la base de datos, asegurando que el entorno sea robusto y escalable.

## 🚀 Analítica y Datos (Pandas)
*   **`analytics/extract_data.py`**: Aquí hemos creado nuestro primer pipeline de datos. Usamos Python con Pandas para extraer toda la info de Supabase y generar reportes CSV automáticos. Esto nos permite analizar el progreso de los usuarios sin afectar al rendimiento de la App.
*   **`analytics/requirements.txt`**: Aquí hemos puesto las piezas necesarias de Python (Pandas y Supabase) para que el entorno de analítica sea fácil de replicar en cualquier máquina.

## 🛠️ Lógica de Servidor
*   **`src/index.ts`**: Aquí hemos levantado el servidor principal. Es el punto de entrada donde configuramos los middlewares de seguridad (CORS) y conectamos todas las rutas de la API.
*   **`src/controllers/`**: Aquí hemos programado la inteligencia del backend. Separamos la lógica de negocio (como el registro de pesos o la autenticación) para que el código sea limpio y fácil de mantener.
*   **`src/routes/`**: Aquí hemos mapeado todos los puntos de acceso de la API. Hemos organizado las rutas por módulos para que el Frontend sepa exactamente a dónde llamar.

## ☁️ Supabase & Edge Functions
*   **`supabase/functions/`**: Aquí hemos desplegado funciones "serverless". Las usamos para tareas específicas como el escaneo de accesos o la salud del sistema, permitiendo que la App sea más rápida y reactiva.
