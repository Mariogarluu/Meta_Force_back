# Meta_Force_back

API REST desarrollada con Node.js, Express, TypeScript y PostgreSQL para Meta Force.

## 📋 Requisitos Previos

- Node.js (versión 18 o superior)
- npm (viene incluido con Node.js)
- PostgreSQL (versión 14 o superior)
- Git

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
# Edita .env con tus configuraciones
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
- `npm run prisma:status` - Verifica el estado de las migraciones

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
- `DELETE /api/users/:id` - Eliminar usuario

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

## 🔐 Autenticación

La API utiliza JWT (JSON Web Tokens) para autenticación. Para acceder a rutas protegidas:

1. Realiza login o registro para obtener un token
2. Incluye el token en el header de las peticiones:
```
Authorization: Bearer <tu-token-jwt>
```

## 🏗️ Estructura del Proyecto

```
Meta_Force_back/
├── src/
│   ├── app.ts              # Configuración principal de Express
│   ├── index.ts            # Punto de entrada
│   ├── config/             # Configuraciones (DB, Swagger, env)
│   ├── middleware/         # Middlewares (auth, validación, errores)
│   ├── modules/             # Módulos de la aplicación
│   │   ├── auth/           # Autenticación
│   │   ├── users/          # Gestión de usuarios
│   │   ├── centers/        # Gestión de centros
│   │   ├── machines/       # Gestión de máquinas
│   │   ├── classes/        # Gestión de clases
│   │   └── access/         # Control de acceso (QR)
│   ├── types/              # Tipos TypeScript
│   ├── utils/              # Utilidades (logger, validación)
│   └── tests/              # Pruebas unitarias
├── prisma/
│   ├── schema.prisma       # Esquema de base de datos
│   └── migrations/         # Migraciones de Prisma
├── docs/                   # Documentación adicional
├── package.json            # Dependencias del proyecto
└── tsconfig.json           # Configuración de TypeScript
```

## 🔒 Seguridad

- **JWT**: Autenticación con tokens
- **bcrypt**: Hash de contraseñas
- **Helmet**: Protección de headers HTTP
- **CORS**: Configuración de origen cruzado
- **Rate Limiting**: Límite de peticiones por IP
- **Validación**: Validación de entrada con Zod
- **Roles**: Sistema de roles y permisos (SUPERADMIN, ADMIN_CENTER, TRAINER, CLEANER, USER)

## 🗄️ Base de Datos

El proyecto utiliza Prisma ORM con PostgreSQL. El esquema de la base de datos está definido en `prisma/schema.prisma`.

### Modelos Principales

- **User**: Usuarios del sistema
- **Center**: Centros de entrenamiento
- **Machine**: Máquinas de gimnasio
- **GymClass**: Clases de gimnasio
- **Access**: Registros de entrada/salida

## 🧪 Testing

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas en modo watch
npm run test:watch

# Generar reporte de cobertura
npm run test:coverage
```

## 🐳 Docker

### Desarrollo
```bash
docker-compose up
```

### Producción
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📖 Documentación Adicional

- `docs/API_EXAMPLES.md` - Ejemplos de uso de la API
- `CHANGELOG.md` - Historial de cambios del proyecto
- Swagger UI en `/api-docs` - Documentación interactiva

## 🤝 Contribuir

Si deseas contribuir al proyecto, por favor:

1. Crea una rama con un nombre descriptivo
2. Escribe código limpio y comentado cuando sea necesario
3. Prueba tus cambios antes de hacer commit
4. Sigue las convenciones de código del proyecto
5. Actualiza la documentación si es necesario

## 📄 Licencia

Este proyecto es privado y pertenece a Meta Force.