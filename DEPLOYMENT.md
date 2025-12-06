# Guía de Despliegue en Render

Esta guía explica cómo desplegar la API de Meta-Force en Render y acceder a la base de datos de producción.

## 📋 Tabla de Contenidos

- [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
- [Configuración de la Base de Datos](#configuración-de-la-base-de-datos)
- [Acceso a Prisma Studio en Producción](#acceso-a-prisma-studio-en-producción)
- [Solución de Problemas](#solución-de-problemas)

---

## 🔧 Configuración de Variables de Entorno

### Variables Requeridas

En Render, ve a tu servicio web → **Environment** y configura las siguientes variables:

#### Opción 1: Usar Internal Database URL (RECOMENDADO) ⭐

1. Ve a tu base de datos PostgreSQL en Render
2. En la sección **"Connections"**, haz clic en el ícono del ojo 👁️ junto a **"Internal Database URL"**
3. Copia la URL completa
4. En tu servicio web → **Environment** → **Add Environment Variable**:
   - **KEY**: `DATABASE_URL`
   - **VALUE**: Pega la URL completa que copiaste

**Ventajas:**
- ✅ Una sola variable
- ✅ Render la mantiene actualizada automáticamente
- ✅ Incluye SSL y configuración correcta
- ✅ Funciona tanto en build como en runtime

#### Opción 2: Usar Variables Separadas

Si prefieres usar variables separadas:

- **DB_USER**: Tu usuario de la base de datos
- **DB_PASSWORD**: Tu contraseña
- **DB_HOST**: El hostname interno (ej: `dpg-xxxxx-a`)
- **DB_PORT**: `5432`
- **DB_DATABASE**: Nombre de la base de datos

**Nota:** Esta opción es menos recomendada porque requiere más configuración y puede tener problemas de conectividad.

### Otras Variables Requeridas

- **JWT_SECRET**: Una cadena aleatoria de al menos 32 caracteres
  - Ejemplo: `tu-secret-super-seguro-de-al-menos-32-caracteres-aqui`

- **NODE_ENV**: `production`

- **BCRYPT_SALT_ROUNDS**: (Opcional) Número de rondas para hashing, default: `10`

### Variables de Cloudinary (si usas imágenes de perfil)

- **CLOUDINARY_CLOUD_NAME**: Tu cloud name de Cloudinary
- **CLOUDINARY_API_KEY**: Tu API key de Cloudinary
- **CLOUDINARY_API_SECRET**: Tu API secret de Cloudinary

---

## 🗄️ Configuración de la Base de Datos

### Solución Final: Usar Internal Database URL

El problema más común al desplegar en Render es la conexión a la base de datos. La solución es usar el **Internal Database URL** completo que Render proporciona.

#### ¿Por qué usar Internal Database URL?

1. **Hostname correcto**: Render proporciona el hostname completo que funciona dentro de su red interna
2. **SSL configurado**: La URL incluye los parámetros SSL necesarios
3. **Mantenimiento automático**: Render actualiza la URL si la base de datos cambia

#### Pasos para Configurar

1. **Obtener Internal Database URL**:
   - Ve a tu base de datos PostgreSQL en Render
   - Sección **"Connections"**
   - Haz clic en el ojo 👁️ junto a **"Internal Database URL"**
   - Copia la URL completa

2. **Configurar en el Servicio Web**:
   - Ve a tu servicio web en Render
   - **Environment** → **Add Environment Variable**
   - **KEY**: `DATABASE_URL`
   - **VALUE**: Pega la URL completa

3. **Verificar**:
   - Después del deploy, revisa los logs
   - Deberías ver: `🔗 Database URL configurada: postgresql://user:****@hostname:5432/database`
   - No deberían aparecer errores de conexión

---

## 🖥️ Acceso a Prisma Studio en Producción

Para acceder a Prisma Studio y gestionar la base de datos de producción, tienes varias opciones:

### Opción 1: SSH Tunnel (Recomendado para Producción)

Esta es la forma más segura de acceder a la base de datos de producción.

#### Requisitos

1. Tener acceso SSH a tu máquina local o servidor
2. Tener `prisma` instalado globalmente: `npm install -g prisma`

#### Pasos

1. **Obtener la External Database URL de Render**:
   - Ve a tu base de datos PostgreSQL en Render
   - Sección **"Connections"**
   - Haz clic en el ojo 👁️ junto a **"External Database URL"**
   - Copia la URL completa

2. **Crear un archivo `.env.production` local** (NO subirlo a Git):
   ```bash
   DATABASE_URL=postgresql://user:password@hostname-externo:5432/database?sslmode=require
   ```

3. **Crear un túnel SSH** (si es necesario):
   ```bash
   # Si Render requiere SSH, configura el túnel
   ssh -L 5432:hostname-externo:5432 usuario@servidor-ssh
   ```

4. **Ejecutar Prisma Studio**:
   ```bash
   # Desde el directorio back/
   dotenv -e .env.production -- npx prisma studio
   ```

   O si tienes el script configurado:
   ```bash
   DATABASE_URL="tu-external-database-url" npx prisma studio
   ```

5. **Abrir en el navegador**:
   - Prisma Studio se abrirá en `http://localhost:5555`

### Opción 2: Usar el Script de Prisma Studio con Variables Separadas

Si estás usando variables separadas en producción:

1. **Crear archivo `.env.production` local**:
   ```bash
   DB_USER=tu-usuario
   DB_PASSWORD=tu-contraseña
   DB_HOST=hostname-externo
   DB_PORT=5432
   DB_DATABASE=nombre-base-datos
   ```

2. **Ejecutar el script de sincronización**:
   ```bash
   npm run prisma:sync-url
   ```

3. **Ejecutar Prisma Studio**:
   ```bash
   dotenv -e .env.production -- npx prisma studio
   ```

### Opción 3: Usar DATABASE_URL Directamente

La forma más simple si tienes la External Database URL:

```bash
# Desde el directorio back/
DATABASE_URL="postgresql://user:password@hostname-externo:5432/database?sslmode=require" npx prisma studio
```

### ⚠️ Importante: Seguridad

- **NUNCA** subas archivos `.env.production` o `.env` con credenciales a Git
- Usa **External Database URL** solo desde tu máquina local o servidor seguro
- **Internal Database URL** solo funciona dentro de la red de Render
- Considera usar un túnel SSH para mayor seguridad

### 🔒 Mejores Prácticas

1. **Usa variables de entorno locales**: Crea `.env.production.local` (en `.gitignore`)
2. **No compartas credenciales**: Nunca compartas URLs de base de datos
3. **Usa conexiones SSL**: Siempre usa `?sslmode=require` en producción
4. **Limita el acceso**: Solo accede desde IPs autorizadas si es posible

---

## 🐛 Solución de Problemas

### Error: "Can't reach database server"

**Causa**: Estás usando el hostname interno (`dpg-xxxxx-a`) fuera de la red de Render.

**Solución**: Usa la **External Database URL** para acceso desde fuera de Render.

### Error: "Connection timeout"

**Causa**: El firewall de Render puede estar bloqueando conexiones externas.

**Solución**: 
1. Verifica que estés usando la External Database URL
2. Asegúrate de que tu IP esté autorizada (si Render lo requiere)
3. Verifica que el puerto 5432 esté abierto

### Error: "SSL required"

**Causa**: La conexión requiere SSL pero no está configurado.

**Solución**: Agrega `?sslmode=require` al final de la DATABASE_URL.

### Error: "Rate limit exceeded"

**Causa**: Demasiadas peticiones desde la misma IP.

**Solución**: Espera 15 minutos o verifica la configuración del rate limiter.

---

## 📚 Referencias

- [Documentación de Render sobre Bases de Datos](https://render.com/docs/databases)
- [Documentación de Prisma Studio](https://www.prisma.io/studio)
- [Guía de Variables de Entorno en Render](https://render.com/docs/environment-variables)

---

## ✅ Checklist de Despliegue

- [ ] Base de datos PostgreSQL creada en Render
- [ ] Internal Database URL configurada en `DATABASE_URL`
- [ ] `JWT_SECRET` configurado (mínimo 32 caracteres)
- [ ] `NODE_ENV` configurado como `production`
- [ ] Variables de Cloudinary configuradas (si aplica)
- [ ] Servicio web desplegado y funcionando
- [ ] Logs verificados sin errores de conexión
- [ ] Prisma Studio configurado para acceso local (si necesario)

---

**Última actualización**: Diciembre 2025

