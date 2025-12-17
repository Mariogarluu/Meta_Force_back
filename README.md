# Meta_Force_back

API REST desarrollada con Node.js, Express, TypeScript y PostgreSQL para Meta Force - Una plataforma completa de gestión de gimnasios.

## 📋 Requisitos Previos

- Node.js (versión 18 o superior)
- npm (viene incluido con Node.js)
- PostgreSQL (versión 14 o superior)
- Git
- Cuenta de Cloudinary (para gestión de imágenes de perfil)

## 🚀 Instalación

1. Clona el repositorio:
```bash
git clone <repository-url>
cd Meta_Force_back
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
# Edita .env con tus configuraciones:
# - DATABASE_URL: URL de conexión a PostgreSQL
# - JWT_SECRET: Clave secreta para JWT (mínimo 32 caracteres)
# - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
```

4. Configura la base de datos:
```bash
# Genera el cliente de Prisma
npm run prisma:generate

# Ejecuta las migraciones
npm run prisma:migrate
```

5. Inicia el servidor de desarrollo:
```bash
npm run dev
```

La API estará disponible en `http://localhost:3000/`

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Entorno de ejecución JavaScript
- **Express** - Framework web minimalista
- **TypeScript** - Superset tipado de JavaScript
- **Prisma** - ORM moderno para bases de datos
- **PostgreSQL** - Base de datos relacional

### Autenticación y Seguridad
- **JWT (jsonwebtoken)** - Tokens de autenticación
- **bcrypt** - Hash de contraseñas
- **Helmet** - Seguridad de headers HTTP
- **express-rate-limit** - Limitación de peticiones
- **Zod** - Validación de esquemas

### Cloud Services
- **Cloudinary** - Gestión y almacenamiento de imágenes
- **Render** - Hosting de aplicaciones y bases de datos
- **Vercel** - Despliegue serverless

### DevOps
- **Docker** - Contenedorización
- **Docker Compose** - Orquestación de contenedores
- **Winston** - Sistema de logging profesional

### Testing
- **Jest** - Framework de testing
- **Supertest** - Testing de APIs HTTP
- **ts-jest** - Soporte TypeScript para Jest

### Documentación
- **Swagger/OpenAPI 3.0.3** - Documentación de API
- **swagger-ui-express** - Interfaz interactiva

### Herramientas de Desarrollo
- **nodemon** - Recarga automática en desarrollo
- **ts-node** - Ejecución directa de TypeScript
- **Morgan** - Logger HTTP para desarrollo

## 📝 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo con nodemon
- `npm run build` - Compila el proyecto TypeScript a JavaScript
- `npm start` - Inicia el servidor en modo producción
- `npm test` - Ejecuta las pruebas unitarias
- `npm run test:watch` - Ejecuta las pruebas en modo watch
- `npm run test:coverage` - Genera reporte de cobertura de pruebas
- `npm run prisma:migrate` - Ejecuta las migraciones de Prisma
- `npm run prisma:generate` - Genera el cliente de Prisma
- `npm run prisma:studio` - Abre Prisma Studio para visualizar la base de datos
- `npm run prisma:studio:prod` - Abre Prisma Studio para base de datos de producción (⚠️ requiere configuración segura)
- `npm run prisma:status` - Verifica el estado de las migraciones
- `npm run prisma:sync-url` - Sincroniza DATABASE_URL desde variables separadas

## 📚 Documentación de la API

La documentación completa de la API está disponible en Swagger UI:

- **URL Local**: `http://localhost:3000/api-docs`
- **Formato**: OpenAPI 3.0.3

### Endpoints Principales

#### Autenticación
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Login y obtención de JWT

#### Usuarios (Requieren JWT)
- `GET /api/users` - Listar usuarios
- `GET /api/users/me` - Obtener perfil del usuario autenticado
- `GET /api/users/:id` - Obtener usuario por ID
- `PATCH /api/users/:id` - Actualizar usuario
- `PATCH /api/users/me` - Actualizar perfil propio
- `PATCH /api/users/me/password` - Cambiar contraseña
- `POST /api/users/me/upload-image` - Subir imagen de perfil
- `DELETE /api/users/:id` - Eliminar usuario
- `GET /api/users/:id/centers` - Obtener centros del usuario
- `GET /api/users/:id/classes` - Obtener clases del usuario

#### Centros
- `GET /api/centers` - Listar centros
- `POST /api/centers` - Crear centro (SUPERADMIN)
- `GET /api/centers/:id` - Obtener centro por ID
- `PATCH /api/centers/:id` - Actualizar centro
- `DELETE /api/centers/:id` - Eliminar centro (SUPERADMIN)

#### Máquinas
- `GET /api/machines` - Listar máquinas
- `POST /api/machines` - Crear máquina
- `GET /api/machines/:id` - Obtener máquina por ID
- `PATCH /api/machines/:id` - Actualizar máquina
- `DELETE /api/machines/:id` - Eliminar máquina

#### Acceso (QR Scanner)
- `POST /api/access/scan` - Escanear código QR para entrada/salida

#### Clases
- `GET /api/classes` - Listar clases
- `POST /api/classes` - Crear clase
- `GET /api/classes/:id` - Obtener clase por ID
- `PATCH /api/classes/:id` - Actualizar clase
- `DELETE /api/classes/:id` - Eliminar clase
- `POST /api/classes/:id/trainers` - Asignar entrenador a clase
- `DELETE /api/classes/:id/trainers/:trainerId` - Eliminar entrenador de clase
- `POST /api/classes/:id/schedules` - Añadir horario a clase
- `GET /api/classes/:id/schedules` - Obtener horarios de clase

#### Notificaciones (Requieren JWT)
- `GET /api/notifications` - Listar notificaciones del usuario
- `PATCH /api/notifications/:id/read` - Marcar notificación como leída
- `DELETE /api/notifications/:id` - Eliminar notificación

## 🔐 Autenticación

La API utiliza JWT (JSON Web Tokens) para autenticación. Para acceder a rutas protegidas:

1. Realiza login o registro para obtener un token
2. Incluye el token en el header de las peticiones:
```
Authorization: Bearer <tu-token-jwt>
```

### Flujo de Autenticación
1. Usuario se registra (`POST /api/auth/register`) con email, nombre y contraseña
2. Sistema valida los datos con Zod
3. Contraseña se hashea con bcrypt (10 rounds por defecto)
4. Se crea el usuario con status PENDING
5. Se genera un JWT válido por 7 días
6. Usuario puede hacer login (`POST /api/auth/login`) para obtener un nuevo token

## 📸 Gestión de Imágenes de Perfil

El sistema integra Cloudinary para gestión de imágenes:

### Características
- **Subida automática a Cloudinary** con transformaciones optimizadas
- **Redimensionamiento inteligente** (400x400px, crop centrado en cara)
- **Calidad automática** y formato óptimo (WebP cuando sea posible)
- **Eliminación automática** de imagen anterior al subir una nueva
- **Validación de archivos** (solo imágenes, tamaño máximo)
- **URLs seguras** (HTTPS) y optimizadas para CDN

### Uso
```bash
# Subir imagen de perfil (requiere JWT)
POST /api/users/me/upload-image
Content-Type: multipart/form-data
Body: profileImage=<archivo>
```

## 🔔 Sistema de Notificaciones

Sistema completo de notificaciones en tiempo real para usuarios:

### Tipos de Notificaciones
- **INFO**: Información general
- **SUCCESS**: Operación exitosa
- **WARNING**: Advertencia
- **ERROR**: Error o problema

### Características
- Notificaciones personalizadas por usuario
- Marcado de leído/no leído
- Enlaces opcionales a recursos
- Eliminación individual
- API REST completa

### Casos de Uso
- Confirmación de registro
- Cambios en clases o horarios
- Actualizaciones de perfil
- Alertas del sistema
- Mensajes administrativos

## 🏗️ Estructura del Proyecto

```
Meta_Force_back/
├── src/
│   ├── app.ts              # Configuración principal de Express
│   ├── index.ts            # Punto de entrada
│   ├── config/             # Configuraciones (DB, Swagger, env, Cloudinary)
│   ├── middleware/         # Middlewares (auth, validación, errores, upload)
│   ├── modules/            # Módulos de la aplicación
│   │   ├── auth/           # Autenticación
│   │   ├── users/          # Gestión de usuarios
│   │   ├── centers/        # Gestión de centros
│   │   ├── machines/       # Gestión de máquinas
│   │   ├── classes/        # Gestión de clases y horarios
│   │   ├── notifications/  # Sistema de notificaciones
│   │   ├── access/         # Control de acceso (QR)
│   │   └── health/         # Health checks
│   ├── services/           # Servicios externos (Cloudinary)
│   ├── types/              # Tipos TypeScript
│   ├── utils/              # Utilidades (logger, validación)
│   └── tests/              # Pruebas unitarias
├── api/                    # Adaptador para Vercel
├── prisma/
│   ├── schema.prisma       # Esquema de base de datos
│   └── migrations/         # Migraciones de Prisma
├── scripts/                # Scripts de utilidad
├── docs/                   # Documentación adicional
├── Dockerfile              # Imagen Docker multi-stage
├── docker-compose.yml      # Orquestación Docker
├── vercel.json             # Configuración Vercel
├── package.json            # Dependencias del proyecto
└── tsconfig.json           # Configuración de TypeScript
```

## 🔒 Seguridad

- **JWT**: Autenticación con tokens (expiración 7 días)
- **bcrypt**: Hash de contraseñas con salt rounds configurables
- **Helmet**: Protección de headers HTTP
- **CORS**: Configuración de origen cruzado
- **Rate Limiting**: Límite de peticiones por IP
  - **General**: 100 requests por 15 minutos (aplica a toda la API)
  - **Auth**: 5 requests por 15 minutos (solo endpoints de autenticación)
  - Cuando se excede el límite, se retorna HTTP 429 (Too Many Requests)
- **Validación**: Validación de entrada con Zod
- **Roles**: Sistema de roles y permisos (SUPERADMIN, ADMIN_CENTER, TRAINER, CLEANER, USER)
- **User Status**: Estados de usuario (PENDING, ACTIVE, INACTIVE)
- **File Upload**: Validación de tamaño y tipo de archivos (solo imágenes)

## 🗄️ Base de Datos

El proyecto utiliza Prisma ORM con PostgreSQL. El esquema de la base de datos está definido en `prisma/schema.prisma`.

### Modelos Principales

- **User**: Usuarios del sistema con roles, status, imagen de perfil y centro favorito
- **Center**: Centros de entrenamiento con información de contacto
- **Machine**: Máquinas de gimnasio asociadas a centros
- **GymClass**: Clases de gimnasio con múltiples entrenadores
- **ClassTrainer**: Relación entre clases y entrenadores
- **ClassCenterSchedule**: Horarios de clases por centro y día de la semana
- **Notification**: Sistema de notificaciones para usuarios
- **Access**: Registros de entrada/salida (QR)

### Enums
- **Role**: SUPERADMIN, ADMIN_CENTER, TRAINER, CLEANER, USER
- **UserStatus**: PENDING, ACTIVE, INACTIVE

## 🧪 Testing

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas en modo watch
npm run test:watch

# Generar reporte de cobertura
npm run test:coverage
```

## 🚢 Despliegue

### Vercel (Recomendado) ⭐

El proyecto está configurado para despliegue serverless en Vercel:

#### Características
- 🚀 **Despliegue automático** desde GitHub
- ⚡ **Serverless functions** con auto-escalado
- 🌍 **CDN global** para baja latencia
- 🔄 **Preview deployments** para cada PR
- 📊 **Analytics** y monitoreo integrados

#### Configuración

1. **Conecta tu repositorio a Vercel**:
   - Visita [vercel.com](https://vercel.com)
   - Importa tu repositorio de GitHub
   - Vercel detectará automáticamente la configuración

2. **Variables de entorno** (en Vercel Dashboard):
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database
   JWT_SECRET=tu-secret-super-seguro-de-al-menos-32-caracteres
   CLOUDINARY_CLOUD_NAME=tu-cloud-name
   CLOUDINARY_API_KEY=tu-api-key
   CLOUDINARY_API_SECRET=tu-api-secret
   NODE_ENV=production
   ```

3. **Configuración de base de datos**:
   - Usa una base de datos PostgreSQL externa (ej: Render, Supabase, Neon)
   - Asegúrate de que la URL incluya `?sslmode=require`

4. **Deploy**:
   - Push a `main` para desplegar a producción
   - Cada PR crea un preview deployment automático

#### Archivos de configuración
- `vercel.json` - Configuración de rutas y rewrites
- `api/index.ts` - Adaptador serverless para Vercel

### Alternativas de Despliegue

#### Docker
```bash
# Desarrollo
docker-compose up -d

# Producción
docker-compose -f docker-compose.prod.yml up -d
```

#### Render
Consulta `DEPLOYMENT.md` y `RENDER_ENV_SETUP.md` para instrucciones detalladas sobre:
- Configuración de variables de entorno
- Conexión a PostgreSQL
- Uso de Internal/External Database URL

### Prisma Studio en Producción
⚠️ **ADVERTENCIA DE SEGURIDAD**: Prisma Studio proporciona acceso directo a la base de datos. Solo úsalo desde redes seguras.

Consulta `PRISMA_STUDIO_PRODUCTION.md` para instrucciones sobre:
- Configuración segura de conexión a producción
- Uso de External Database URL
- Mejores prácticas de seguridad
- Acceso mediante túnel SSH (recomendado)

## 📖 Documentación Adicional

- `docs/API_EXAMPLES.md` - Ejemplos de uso de la API
- `CHANGELOG.md` - Historial completo de cambios del proyecto
- `DEPLOYMENT.md` - Guía completa de despliegue en Render
- `RENDER_ENV_SETUP.md` - Configuración de variables de entorno en Render
- `PRISMA_STUDIO_PRODUCTION.md` - Acceso a Prisma Studio en producción
- Swagger UI en `/api-docs` - Documentación interactiva OpenAPI 3.0.3

## ✨ Características Destacadas

- 🔐 **Autenticación JWT completa** con registro, login y renovación de tokens
- 👤 **Gestión de perfiles** con imágenes de perfil en Cloudinary
- 🏢 **Multi-centro** con selección de centro favorito
- 📅 **Sistema de clases** con múltiples entrenadores y horarios personalizados
- 🔔 **Notificaciones en tiempo real** para usuarios
- 🔒 **Control de acceso basado en roles** (5 niveles)
- 📊 **Prisma Studio** para administración visual de datos
- 📝 **Documentación Swagger/OpenAPI** completa e interactiva
- 🧪 **Testing** con Jest y Supertest (>20 tests)
- 📈 **Logging profesional** con Winston
- 🛡️ **Rate limiting** y protección contra brute force
- 🐳 **Docker** con multi-stage builds optimizados
- ☁️ **Despliegue serverless en Vercel** con auto-escalado y CDN global

## 🤝 Contribuir

Si deseas contribuir al proyecto, por favor:

1. Crea una rama con un nombre descriptivo
2. Escribe código limpio y comentado cuando sea necesario
3. Prueba tus cambios antes de hacer commit (ejecuta `npm test`)
4. Sigue las convenciones de código del proyecto
5. Actualiza la documentación si es necesario
6. Actualiza el CHANGELOG.md con tus cambios

## 📄 Licencia

Este proyecto es privado y pertenece a Meta Force.
