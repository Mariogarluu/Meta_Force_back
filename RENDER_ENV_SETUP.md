# Configuración de Variables de Entorno en Render

Esta guía te ayudará a configurar las variables de entorno para tu aplicación en Render.

## Opción 1: Usar Internal Database URL (RECOMENDADO) ⭐

Esta es la forma más fácil y confiable. Render proporciona una URL completa que incluye todo.

### Pasos:

1. Ve a tu base de datos PostgreSQL en Render
2. En la sección "Connections", haz clic en el ícono del ojo 👁️ junto a **"Internal Database URL"**
3. Copia la URL completa (tendrá un formato como: `postgresql://user:password@host:port/database?sslmode=require`)
4. Ve a tu servicio web en Render → "Environment" → "Add Environment Variable"
5. Agrega:
   - **KEY**: `DATABASE_URL`
   - **VALUE**: Pega la URL completa que copiaste
6. Guarda y despliega

**Ventajas:**
- ✅ Una sola variable
- ✅ Render la mantiene actualizada automáticamente
- ✅ Incluye SSL y configuración correcta
- ✅ Funciona tanto en build como en runtime

---

## Opción 2: Usar Variables Separadas

Si prefieres usar variables separadas, configura las siguientes:

### Variables Requeridas:

1. **DB_USER**
   - Valor: `jim` (según tu configuración)

2. **DB_PASSWORD**
   - Valor: Tu contraseña de la base de datos (haz clic en el ojo 👁️ para verla)

3. **DB_HOST**
   - Valor: `dpg-d4oktnndiees739km8m0-a` (el hostname interno de Render)

4. **DB_PORT**
   - Valor: `5432`

5. **DB_DATABASE**
   - Valor: `meta_force`

### Pasos:

1. Ve a tu servicio web en Render → "Environment"
2. Agrega cada variable una por una:
   - `DB_USER` = `jim`
   - `DB_PASSWORD` = (tu contraseña)
   - `DB_HOST` = `dpg-d4oktnndiees739km8m0-a`
   - `DB_PORT` = `5432`
   - `DB_DATABASE` = `meta_force`

---

## Otras Variables Requeridas

Además de la base de datos, necesitas configurar:

### Variables de Seguridad:

- **JWT_SECRET**: Una cadena aleatoria de al menos 32 caracteres
  - Ejemplo: `tu-secret-super-seguro-de-al-menos-32-caracteres-aqui`

- **BCRYPT_SALT_ROUNDS**: Número de rondas para hashing (opcional, default: 10)
  - Valor: `10` o mayor

### Variables de Configuración:

- **NODE_ENV**: Entorno de ejecución
  - Valor: `production`

- **PORT**: Puerto del servidor (Render lo establece automáticamente, pero puedes dejarlo)
  - Valor: Dejar que Render lo maneje automáticamente

### Variables de Cloudinary (si usas imágenes de perfil):

- **CLOUDINARY_CLOUD_NAME**: Tu cloud name de Cloudinary
- **CLOUDINARY_API_KEY**: Tu API key de Cloudinary
- **CLOUDINARY_API_SECRET**: Tu API secret de Cloudinary

---

## Resumen de Variables para Render

### Mínimas Requeridas (Opción 1 - DATABASE_URL):
```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
JWT_SECRET=tu-secret-super-seguro-de-al-menos-32-caracteres
NODE_ENV=production
```

### Mínimas Requeridas (Opción 2 - Variables Separadas):
```
DB_USER=jim
DB_PASSWORD=tu-contraseña
DB_HOST=dpg-d4oktnndiees739km8m0-a
DB_PORT=5432
DB_DATABASE=meta_force
JWT_SECRET=tu-secret-super-seguro-de-al-menos-32-caracteres
NODE_ENV=production
```

---

## Verificación

Después de configurar las variables:

1. Guarda los cambios en Render
2. El servicio se desplegará automáticamente
3. Revisa los logs para verificar que:
   - ✅ `DATABASE_URL establecida` o `DATABASE_URL ya está establecida`
   - ✅ `API escuchando en http://0.0.0.0:XXXX`
   - ✅ No hay errores de conexión a la base de datos

---

## Notas Importantes

- 🔒 **Nunca** subas las variables de entorno al repositorio
- 🔒 Render enmascara automáticamente las contraseñas en los logs
- ✅ Usa **Internal Database URL** si tu servicio web está en la misma región que la base de datos
- ✅ Usa **External Database URL** si están en regiones diferentes
- ⚠️ El hostname interno (`dpg-xxxxx-a`) solo funciona dentro de la red de Render


