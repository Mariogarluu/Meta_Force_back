# Acceso a Prisma Studio en Producción

Esta guía explica cómo acceder a Prisma Studio para gestionar la base de datos de producción en Render.

## 🎯 Método Recomendado: External Database URL

### Paso 1: Obtener External Database URL

1. Ve a tu base de datos PostgreSQL en Render
2. En la sección **"Connections"**, haz clic en el ojo 👁️ junto a **"External Database URL"**
3. Copia la URL completa (formato: `postgresql://user:password@hostname:5432/database?sslmode=require`)

### Paso 2: Configurar Variable de Entorno Local

Crea un archivo `.env.production.local` en el directorio `back/` (este archivo NO debe subirse a Git):

```bash
# back/.env.production.local
DATABASE_URL=postgresql://user:password@hostname-externo:5432/database?sslmode=require
```

**⚠️ IMPORTANTE**: Asegúrate de que `.env.production.local` esté en `.gitignore`:

```bash
# .gitignore
.env.production.local
.env.local
```

### Paso 3: Ejecutar Prisma Studio

Desde el directorio `back/`, ejecuta:

```bash
# Opción 1: Usando dotenv-cli
dotenv -e .env.production.local -- npx prisma studio

# Opción 2: Directamente con DATABASE_URL
DATABASE_URL="postgresql://user:password@hostname:5432/database?sslmode=require" npx prisma studio
```

### Paso 4: Abrir en el Navegador

Prisma Studio se abrirá automáticamente en `http://localhost:5555`

---

## 🔄 Método Alternativo: Usando Variables Separadas

Si prefieres usar variables separadas:

### Paso 1: Crear `.env.production.local`

```bash
# back/.env.production.local
DB_USER=tu-usuario
DB_PASSWORD=tu-contraseña
DB_HOST=hostname-externo
DB_PORT=5432
DB_DATABASE=nombre-base-datos
```

### Paso 2: Sincronizar DATABASE_URL

```bash
npm run prisma:sync-url
```

Esto creará/actualizará `DATABASE_URL` en el archivo `.env.production.local`.

### Paso 3: Ejecutar Prisma Studio

```bash
dotenv -e .env.production.local -- npx prisma studio
```

---

## 🛠️ Script Personalizado (Opcional)

Puedes crear un script en `package.json` para facilitar el acceso:

```json
{
  "scripts": {
    "prisma:studio:prod": "dotenv -e .env.production.local -- prisma studio"
  }
}
```

Luego ejecuta:

```bash
npm run prisma:studio:prod
```

---

## 🔒 Seguridad

### ⚠️ Advertencias Importantes

1. **NUNCA subas credenciales a Git**: Asegúrate de que `.env.production.local` esté en `.gitignore`
2. **Usa External Database URL**: Solo la External URL funciona desde fuera de Render
3. **Conexiones SSL**: Siempre usa `?sslmode=require` en producción
4. **Acceso limitado**: Solo accede desde máquinas seguras

### Mejores Prácticas

- ✅ Usa un archivo `.env.production.local` separado
- ✅ Agrega `.env.production.local` a `.gitignore`
- ✅ No compartas credenciales
- ✅ Usa conexiones SSL siempre
- ✅ Cierra Prisma Studio cuando no lo uses

---

## 🐛 Solución de Problemas

### Error: "Can't reach database server"

**Causa**: Estás usando Internal Database URL fuera de Render.

**Solución**: Usa la **External Database URL** para acceso desde fuera de Render.

### Error: "Connection timeout"

**Causa**: Firewall o IP no autorizada.

**Solución**: 
- Verifica que estés usando External Database URL
- Asegúrate de que tu IP esté autorizada (si Render lo requiere)

### Error: "SSL required"

**Causa**: Falta el parámetro SSL en la URL.

**Solución**: Agrega `?sslmode=require` al final de la DATABASE_URL.

---

## 📝 Ejemplo Completo

```bash
# 1. Crear archivo de entorno local
cat > back/.env.production.local << EOF
DATABASE_URL=postgresql://usuario:contraseña@hostname-externo:5432/nombre-base-datos?sslmode=require
EOF

# 2. Verificar que está en .gitignore
echo ".env.production.local" >> back/.gitignore

# 3. Ejecutar Prisma Studio
cd back
dotenv -e .env.production.local -- npx prisma studio

# 4. Abrir en navegador
# Prisma Studio estará disponible en http://localhost:5555
```

---

**Nota**: Esta guía asume que tienes acceso a la External Database URL de Render. Si no tienes acceso, contacta con el administrador del proyecto.

