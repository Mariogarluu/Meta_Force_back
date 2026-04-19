# Meta Force Frontend 🏋️

Aplicación frontend desarrollada con Angular 19 para la gestión integral de centros deportivos Meta Force. Sistema completo de gestión de usuarios, centros, máquinas, clases y entrenadores con soporte multiidioma y temas personalizables.

## 🌟 Características Principales

- **🔐 Autenticación y Autorización**: Sistema JWT con roles (SUPERADMIN, ADMIN_CENTER, CLIENT)
- **👥 Gestión de Usuarios**: CRUD completo con control de acceso por roles
- **🏢 Gestión de Centros**: Administración de centros deportivos
- **💪 Gestión de Máquinas**: Control de equipamiento y estados
- **📅 Gestión de Clases**: Programación y seguimiento de clases
- **👨‍🏫 Gestión de Entrenadores**: Administración del personal
- **📱 Código QR**: Generación y escaneo de códigos QR para acceso
- **🌍 Multiidioma**: Soporte para Español, Inglés y Francés
- **🎨 Temas**: Modo claro y oscuro con persistencia
- **📊 Dashboard Interactivo**: Visualización de datos y estadísticas
- **🔔 Sistema de Notificaciones**: Alertas y mensajes en tiempo real
- **📸 Gestión de Imágenes**: Upload y manejo de fotos de perfil
- **🛡️ Seguridad**: Guards, interceptores y manejo de errores

## 📋 Requisitos Previos

- **Node.js** (versión 18 o superior) - [Descargar](https://nodejs.org/)
- **npm** (viene incluido con Node.js)
- **Git** - [Descargar](https://git-scm.com/)
- **Angular CLI** (opcional, recomendado): `npm install -g @angular/cli`

## 🚀 Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/Mariogarluu/Meta_Force_front.git
cd Meta_Force_front
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm start
```

La aplicación estará disponible en `http://localhost:4200/`

## 📝 Scripts Disponibles

- `npm start` - Inicia el servidor de desarrollo en http://localhost:4200
- `npm run build` - Compila el proyecto para producción
- `npm run watch` - Compila el proyecto en modo desarrollo con watch
- `npm test` - Ejecuta las pruebas unitarias con Karma y Jasmine
- `ng serve` - Alternativa para iniciar el servidor de desarrollo
- `ng generate component <name>` - Genera un nuevo componente
- `ng build --configuration production` - Build optimizado para producción

## 🎨 Temas

La aplicación soporta modo claro y oscuro:

- **Toggle de tema**: Disponible en todas las páginas principales
- **Persistencia**: La preferencia de tema se guarda en localStorage
- **Adaptación automática**: Los componentes se adaptan automáticamente al tema seleccionado

## 🔄 Flujo de Trabajo con Git (Workflow)

### Proceso para Subir Cambios desde tu Rama Personal

Sigue estos pasos para integrar tus cambios a la rama `develop`:

#### 1. **Commit en tu rama personal**
Primero, asegúrate de estar en tu rama y realiza los commits de tus cambios:

```bash
# Verifica que estés en tu rama
git branch

# Añade los archivos modificados
git add .

# Realiza el commit con un mensaje descriptivo
git commit -m "Descripción clara de los cambios realizados"
```

#### 2. **Pull de develop**
Antes de hacer el merge, actualiza tu rama local de `develop` con los últimos cambios del repositorio remoto:

```bash
# Cambia a la rama develop
git checkout develop

# Actualiza develop con los cambios remotos
git pull origin develop
```

#### 3. **Merge en tu rama**
Vuelve a tu rama personal e integra los cambios de `develop`:

```bash
# Regresa a tu rama personal
git checkout tu-rama-personal

# Realiza el merge de develop en tu rama
git merge develop
```

**Importante:** Si hay conflictos durante el merge, resuélvelos manualmente:
- Abre los archivos con conflictos
- Busca las marcas de conflicto (`<<<<<<<`, `=======`, `>>>>>>>`)
- Edita el archivo para mantener los cambios correctos
- Guarda los archivos
- Añade los archivos resueltos: `git add .`
- Completa el merge: `git commit`

#### 4. **Cuando el merge esté completado**
Una vez que hayas resuelto todos los conflictos y probado que todo funciona correctamente:

```bash
# Cambia a la rama develop
git checkout develop

# Realiza el merge de tu rama en develop
git merge tu-rama-personal

# Sube los cambios a develop en el repositorio remoto
git push origin develop
```

### 📌 Resumen del Flujo

```
1. git checkout tu-rama-personal
2. git add .
3. git commit -m "tu mensaje"
4. git checkout develop
5. git pull origin develop
6. git checkout tu-rama-personal
7. git merge develop
8. [Resolver conflictos si existen]
9. git checkout develop
10. git merge tu-rama-personal
11. git push origin develop
```

### ⚠️ Buenas Prácticas

- **Commits frecuentes**: Realiza commits pequeños y con mensajes descriptivos
- **Pull antes de push**: Siempre actualiza `develop` antes de mergear tus cambios
- **Prueba antes de mergear**: Asegúrate de que tu código funcione correctamente antes de mergear a `develop`
- **Resuelve conflictos con cuidado**: Revisa detenidamente los conflictos antes de resolverlos
- **Mantén tu rama actualizada**: Haz merge de `develop` en tu rama personal regularmente para evitar conflictos grandes

## 🌐 Internacionalización (i18n)

La aplicación soporta múltiples idiomas mediante `ngx-translate`. Los idiomas disponibles son:

- **Español (es)** - Idioma por defecto
- **Inglés (en)**
- **Francés (fr)**

### Características de Traducción

- **Selector de idioma**: Disponible en todas las páginas principales
- **Traducción dinámica**: Todos los textos de interfaz se traducen automáticamente
- **Persistencia**: El idioma seleccionado se guarda en localStorage
- **Filtros traducidos**: Los filtros de búsqueda se adaptan al idioma seleccionado
- **Estados y roles**: Los estados de usuarios, roles y tipos de máquinas se traducen dinámicamente

### Archivos de Traducción

Los archivos de traducción se encuentran en:
```
public/assets/i18n/
├── es.json  # Español
├── en.json  # Inglés
└── fr.json  # Francés
```

### Uso en Componentes

Para usar traducciones en un componente:

1. Importa `TranslateModule`:
```typescript
import { TranslateModule } from '@ngx-translate/core';

@Component({
  imports: [CommonModule, TranslateModule, ...],
  ...
})
```

2. Usa el pipe `translate` en el template:
```html
<h1>{{ 'users.title' | translate }}</h1>
<button>{{ 'common.save' | translate }}</button>
```

3. Para traducciones en TypeScript:
```typescript
import { TranslateService } from '@ngx-translate/core';

constructor(private translate: TranslateService) {}

getMessage() {
  return this.translate.instant('users.title');
}
```

### Componentes Traducidos

- ✅ Login
- ✅ Register
- ✅ Dashboard
- ✅ Home
- ✅ Navbar
- ✅ QR Code
- ✅ QR Scanner
- ✅ Users Management
- ✅ Centers Management
- ✅ Machines Management
- ✅ Theme Toggle
- ✅ Language Selector

## 🏗️ Estructura del Proyecto

```
Meta_Force_front/
├── src/
│   ├── app/
│   │   ├── core/                    # Funcionalidad core de la aplicación
│   │   │   ├── guards/              # Guards de rutas (auth, guest, role)
│   │   │   ├── interceptors/        # HTTP interceptors (auth)
│   │   │   ├── models/              # Interfaces y tipos TypeScript
│   │   │   └── services/            # Servicios core
│   │   │       ├── auth.service.ts           # Autenticación JWT
│   │   │       ├── users.service.ts          # Gestión de usuarios
│   │   │       ├── centers.service.ts        # Gestión de centros
│   │   │       ├── machines.service.ts       # Gestión de máquinas
│   │   │       ├── classes.service.ts        # Gestión de clases
│   │   │       ├── theme.service.ts          # Gestión de temas
│   │   │       ├── translation.service.ts    # Gestión de idiomas
│   │   │       ├── notification.service.ts   # Sistema de notificaciones
│   │   │       └── error.service.ts          # Manejo de errores
│   │   ├── pages/                   # Páginas de la aplicación
│   │   │   ├── home/                # Página principal (landing)
│   │   │   ├── login/               # Página de login
│   │   │   ├── register/            # Página de registro
│   │   │   ├── dashboard/           # Dashboard principal
│   │   │   ├── users/               # Gestión de usuarios (CRUD)
│   │   │   ├── centers/             # Gestión de centros (CRUD)
│   │   │   ├── machines/            # Gestión de máquinas (CRUD)
│   │   │   ├── clases/              # Gestión de clases (CRUD)
│   │   │   ├── trainers/            # Gestión de entrenadores (CRUD)
│   │   │   ├── qr/                  # Generador de código QR
│   │   │   └── qr-scanner/          # Escáner QR (roles específicos)
│   │   └── shared/                  # Componentes compartidos
│   │       └── components/
│   │           ├── navbar/                    # Barra de navegación
│   │           ├── footer/                    # Pie de página
│   │           ├── theme-toggle/              # Selector de tema
│   │           ├── language-selector/         # Selector de idioma
│   │           ├── error-toast/               # Componente de errores
│   │           └── profile-image-manager/     # Gestión de imágenes
│   ├── environments/            # Variables de entorno
│   │   ├── environment.ts               # Producción
│   │   └── environment.development.ts   # Desarrollo
│   ├── styles/                  # Estilos globales
│   └── index.html               # Archivo HTML principal
├── public/
│   ├── assets/
│   │   └── i18n/                # Archivos de traducción (es, en, fr)
│   └── Logo.png                 # Logo de la aplicación
├── docs/                        # Documentación adicional
├── angular.json                 # Configuración de Angular
├── package.json                 # Dependencias del proyecto
├── tailwind.config.js           # Configuración de Tailwind CSS
├── tsconfig.json                # Configuración de TypeScript
└── vercel.json                  # Configuración de despliegue en Vercel
```

## 🔧 Tecnologías y Dependencias

### Framework y Lenguajes
- **Angular 19.2** - Framework principal
- **TypeScript 5.7** - Lenguaje de programación
- **RxJS 7.8** - Programación reactiva
- **Angular Signals** - Gestión de estado reactivo

### Estilos
- **Tailwind CSS 3.4** - Framework de estilos utility-first
- **SCSS** - Preprocesador CSS
- **PostCSS & Autoprefixer** - Procesamiento de CSS

### Internacionalización
- **@ngx-translate/core 17.0** - Sistema de internacionalización
- **@ngx-translate/http-loader** - Carga de traducciones

### Autenticación y Seguridad
- **JWT (jsonwebtoken)** - Tokens de autenticación
- **HTTP Interceptors** - Inyección automática de tokens
- **Guards** - Protección de rutas

### Utilidades
- **html5-qrcode 2.3** - Generación y escaneo de códigos QR

### Testing
- **Jasmine 5.6** - Framework de testing
- **Karma 6.4** - Test runner

### Herramientas de Desarrollo
- **Angular CLI 19.2** - Herramienta de línea de comandos
- **Angular DevKit** - Herramientas de desarrollo

## 🔐 Autenticación y Roles

El sistema implementa un sistema de autenticación basado en JWT con tres roles principales:

### Roles Disponibles

1. **SUPERADMIN** 
   - Acceso completo a todas las funcionalidades
   - Gestión de usuarios, centros, máquinas, clases y entrenadores
   - Acceso al escáner QR

2. **ADMIN_CENTER**
   - Gestión de su centro específico
   - Gestión de máquinas y clases de su centro
   - Acceso al escáner QR
   - Visualización de estadísticas

3. **CLIENT**
   - Acceso a su perfil y datos personales
   - Visualización de clases disponibles
   - Generación de código QR personal
   - Visualización del dashboard

### Flujo de Autenticación

```
1. Usuario → Login/Register
2. Backend valida credenciales
3. Backend genera JWT token
4. Frontend almacena token en localStorage
5. HTTP Interceptor añade token en cada petición
6. Guards protegen rutas según roles
```

## 🌐 Integración con API

La aplicación se conecta a un backend REST API desplegado en Vercel:
- **API URL (Producción)**: `https://meta-force-back.vercel.app/api`
- **Configuración**: `/src/environments/environment.ts`

### Endpoints Principales

- `POST /api/auth/login` - Autenticación
- `POST /api/auth/register` - Registro
- `GET /api/auth/profile` - Perfil del usuario
- `GET /api/users` - Listar usuarios
- `GET /api/centers` - Listar centros
- `GET /api/machines` - Listar máquinas
- `GET /api/classes` - Listar clases

Ver documentación completa en [API.md](./docs/API.md)

## 🚀 Despliegue

El proyecto está configurado para desplegarse en **Vercel**:

1. **Build Command**: `npm run build -- --configuration production`
2. **Output Directory**: `dist/credentials/browser`
3. **Framework**: Angular

La configuración de despliegue se encuentra en `vercel.json` con rewrites para SPA.

Para más detalles sobre despliegue: [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## 🛡️ Seguridad

El proyecto implementa múltiples capas de seguridad:

- **JWT Authentication**: Tokens seguros con expiración
- **Route Guards**: Protección de rutas por autenticación y roles
- **HTTP Interceptors**: Inyección automática de tokens
- **Error Handling**: Manejo centralizado de errores
- **CORS**: Configuración de orígenes permitidos
- **XSS Protection**: Sanitización de inputs

Ver más en [SECURITY.md](./docs/SECURITY.md)

## 🐛 Solución de Problemas

### Error: "Cannot find module @angular/..."
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: Puerto 4200 ya en uso
```bash
# Encuentra el proceso usando el puerto
lsof -ti:4200 | xargs kill -9
# O usa un puerto diferente
ng serve --port 4300
```

### Problemas con traducciones
- Verificar que existan los archivos en `public/assets/i18n/`
- Limpiar caché del navegador
- Revisar que las keys estén en todos los idiomas

### Build falla en producción
```bash
# Aumentar memoria de Node.js
export NODE_OPTIONS=--max_old_space_size=4096
npm run build
```

## 🧪 Testing

Ejecutar tests:
```bash
# Todos los tests
npm test

# Tests con cobertura
ng test --code-coverage

# Tests en modo headless (CI)
ng test --watch=false --browsers=ChromeHeadless
```

## 📚 Documentación Adicional

- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Arquitectura técnica detallada
- [CONTRIBUTING.md](./docs/CONTRIBUTING.md) - Guía de contribución
- [API.md](./docs/API.md) - Documentación de la API
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Guía de despliegue
- [SECURITY.md](./docs/SECURITY.md) - Prácticas de seguridad

## 🤝 Contribuir

Si deseas contribuir al proyecto, por favor lee [CONTRIBUTING.md](./docs/CONTRIBUTING.md) y sigue el flujo de trabajo descrito.

Puntos clave:
1. Crear una rama con un nombre descriptivo
2. Escribir código limpio y comentado cuando sea necesario
3. Probar tus cambios antes de hacer el merge
4. Seguir las convenciones de código del proyecto (EditorConfig)
5. Agregar traducciones para nuevos textos en los 3 idiomas (es, en, fr)
6. Mantener la consistencia en el uso de traducciones (no hardcodear textos)

## 👥 Equipo

Desarrollado por el equipo de Meta Force.

## 📄 Licencia

Este proyecto es privado y pertenece a Meta Force.

---

**¿Necesitas ayuda?** Consulta la documentación o contacta al equipo de desarrollo.
