# Guía de Solución de Problemas con Migraciones de Prisma

Esta guía te ayudará a diagnosticar y resolver problemas comunes con las migraciones de Prisma en este proyecto.

## 🚀 Inicio Rápido

**Para diagnosticar problemas automáticamente:**
```powershell
cd back
npm run prisma:diagnose
```

Este comando ejecutará un diagnóstico completo y te mostrará qué está mal y cómo solucionarlo.

## 📋 Índice

1. [Diagnóstico Inicial](#diagnóstico-inicial)
2. [Problemas Comunes y Soluciones](#problemas-comunes-y-soluciones)
3. [Comandos Útiles](#comandos-útiles)
4. [Escenarios Específicos](#escenarios-específicos)
5. [Prevención de Problemas](#prevención-de-problemas)

---

## 🔍 Diagnóstico Inicial

Antes de resolver cualquier problema, ejecuta estos comandos para entender el estado actual:

### 1. Verificar el estado de las migraciones

```powershell
cd back
npm run prisma:status
```

Este comando te mostrará:
- Qué migraciones están aplicadas
- Qué migraciones están pendientes
- Si hay problemas de sincronización

### 2. Verificar la conexión a la base de datos

```powershell
cd back
npx prisma db pull
```

Si este comando falla, el problema es de conexión, no de migraciones.

### 3. Verificar el schema de Prisma

```powershell
cd back
npx prisma validate
```

Esto verificará que el schema.prisma esté correctamente formateado.

---

## 🛠️ Problemas Comunes y Soluciones

### Problema 1: "Migration failed to apply"

**Síntomas:**
- Error al ejecutar `prisma migrate dev`
- Mensaje indicando que una migración falló

**Solución:**

```powershell
cd back

# 1. Ver el estado actual
npm run prisma:status

# 2. Marcar la migración problemática como resuelta (si ya aplicaste los cambios manualmente)
npx prisma migrate resolve --applied nombre_de_la_migracion

# 3. O marcar como revertida si necesitas recrearla
npx prisma migrate resolve --rolled-back nombre_de_la_migracion

# 4. Crear una nueva migración
npm run prisma:migrate -- --name fix_migration
```

### Problema 2: "Schema and database are out of sync"

**Síntomas:**
- El schema.prisma no coincide con la base de datos real
- Errores al generar el cliente

**Solución:**

```powershell
cd back

# Opción A: Sincronizar el schema con la base de datos (si la BD tiene la verdad)
npx prisma db pull

# Opción B: Aplicar el schema a la base de datos (si el schema tiene la verdad)
npx prisma db push

# Opción C: Crear una migración que sincronice todo
npm run prisma:migrate -- --name sync_schema_and_db
```

### Problema 3: "Migration X is in a failed state"

**Síntomas:**
- Una migración específica está marcada como fallida
- No puedes crear nuevas migraciones

**Solución:**

```powershell
cd back

# 1. Ver qué migración está fallida
npm run prisma:status

# 2. Si la migración ya se aplicó manualmente, marcarla como aplicada
npx prisma migrate resolve --applied nombre_migracion_fallida

# 3. Si necesitas revertirla completamente
npx prisma migrate resolve --rolled-back nombre_migracion_fallida

# 4. Si la migración tiene errores SQL, edítala manualmente:
# - Ve a: prisma/migrations/nombre_migracion/migration.sql
# - Corrige el SQL
# - Luego marca como aplicada o créala de nuevo
```

### Problema 4: "The migration X has already been applied"

**Síntomas:**
- Prisma intenta aplicar una migración que ya existe
- Conflicto en el historial de migraciones

**Solución:**

```powershell
cd back

# 1. Verificar el estado real de la base de datos
npx prisma migrate status

# 2. Si la migración realmente está aplicada, marcarla como tal
npx prisma migrate resolve --applied nombre_migracion

# 3. Si hay duplicados, elimina la migración duplicada de la carpeta:
# prisma/migrations/ y luego regenera
```

### Problema 5: "Cannot find module '@prisma/client'"

**Síntomas:**
- El cliente de Prisma no está generado
- Errores de importación

**Solución:**

```powershell
cd back

# Regenerar el cliente de Prisma
npm run prisma:generate

# O directamente:
npx prisma generate
```

---

## 📝 Comandos Útiles

### Comandos de Diagnóstico

```powershell
# Ver estado de migraciones
npm run prisma:status

# Validar el schema
npx prisma validate

# Ver diferencias entre schema y BD
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma

# Ver el SQL que se generaría sin aplicarlo
npx prisma migrate dev --create-only
```

### Comandos de Migración

```powershell
# Crear nueva migración (desarrollo)
npm run prisma:migrate -- --name nombre_migracion

# Aplicar migraciones pendientes (producción)
npx prisma migrate deploy

# Resetear base de datos (¡CUIDADO! Borra todos los datos)
npx prisma migrate reset

# Aplicar cambios sin crear migración (solo desarrollo)
npx prisma db push
```

### Comandos de Cliente

```powershell
# Regenerar cliente Prisma
npm run prisma:generate

# Abrir Prisma Studio (interfaz visual)
npm run prisma:studio
```

---

## 🎯 Escenarios Específicos

### Escenario 1: Agregaste un nuevo modelo (ej: MembershipPlan)

**Pasos:**

```powershell
cd back

# 1. Asegúrate de que el modelo esté en schema.prisma
# (Ya debería estar)

# 2. Crear la migración
npm run prisma:migrate -- --name add_membership_plan

# 3. Regenerar el cliente
npm run prisma:generate

# 4. Verificar que compile
npm run build
```

### Escenario 2: Modificaste un modelo existente

**Pasos:**

```powershell
cd back

# 1. Crear migración para los cambios
npm run prisma:migrate -- --name modify_model_name

# 2. Si hay datos existentes, Prisma te preguntará cómo manejar los cambios
# - Si agregas un campo requerido sin default, tendrás que proporcionar un valor
# - Si eliminas un campo, los datos se perderán

# 3. Regenerar cliente
npm run prisma:generate
```

### Escenario 3: Base de datos en producción está desincronizada

**⚠️ IMPORTANTE: Hacer backup antes de cualquier cambio en producción**

```powershell
cd back

# 1. Ver qué migraciones faltan en producción
npx prisma migrate status

# 2. Aplicar solo las migraciones pendientes (no crea nuevas)
npx prisma migrate deploy

# 3. Regenerar cliente
npm run prisma:generate
```

### Escenario 4: Necesitas revertir una migración

**⚠️ CUIDADO: Esto puede causar pérdida de datos**

```powershell
cd back

# Opción A: Resetear toda la base de datos (desarrollo)
npx prisma migrate reset

# Opción B: Crear una migración que revierta los cambios manualmente
# 1. Edita schema.prisma para revertir los cambios
# 2. Crea nueva migración: npm run prisma:migrate -- --name revert_changes
# 3. O edita manualmente el SQL en la migración anterior
```

### Escenario 5: Migración falló a mitad de ejecución

```powershell
cd back

# 1. Ver qué migración falló
npm run prisma:status

# 2. Conectar a la base de datos y verificar el estado manualmente
# (usar psql o Prisma Studio)

# 3. Si la migración se aplicó parcialmente:
#    - Revertir manualmente los cambios SQL
#    - Marcar como revertida: npx prisma migrate resolve --rolled-back nombre_migracion
#    - Crear nueva migración corregida

# 4. Si la migración no se aplicó:
#    - Corregir el SQL en prisma/migrations/nombre/migration.sql
#    - Marcar como resuelta: npx prisma migrate resolve --applied nombre_migracion
#    - O eliminar la migración y crear una nueva
```

---

## 🔒 Prevención de Problemas

### Buenas Prácticas

1. **Siempre revisa el SQL generado antes de aplicar**
   ```powershell
   npx prisma migrate dev --create-only
   # Revisa el archivo SQL generado antes de aplicar
   ```

2. **Haz backup antes de migraciones importantes**
   ```powershell
   # En producción, siempre haz backup de la BD antes de migrar
   pg_dump -h localhost -U usuario -d nombre_bd > backup.sql
   ```

3. **Usa nombres descriptivos para las migraciones**
   ```powershell
   npm run prisma:migrate -- --name add_user_profile_image
   # No uses nombres genéricos como "update" o "fix"
   ```

4. **Valida el schema antes de crear migraciones**
   ```powershell
   npx prisma validate
   ```

5. **En desarrollo, usa `db push` para prototipar rápido**
   ```powershell
   npx prisma db push
   # Luego crea la migración formal cuando estés seguro
   ```

### Checklist Antes de Migrar

- [ ] Schema validado (`npx prisma validate`)
- [ ] Backup de base de datos (producción)
- [ ] Revisado el SQL generado
- [ ] Cliente Prisma regenerado después de migrar
- [ ] Código compila sin errores (`npm run build`)
- [ ] Pruebas ejecutadas

---

## 🆘 Solución de Último Recurso

Si nada funciona y necesitas empezar de cero (¡SOLO EN DESARROLLO!):

```powershell
cd back

# 1. Eliminar todas las migraciones
Remove-Item -Recurse -Force prisma\migrations\*

# 2. Resetear la base de datos
npx prisma migrate reset --force

# 3. Crear migración inicial desde el schema actual
npx prisma migrate dev --name init

# 4. Regenerar cliente
npm run prisma:generate
```

**⚠️ ADVERTENCIA:** Esto eliminará todos los datos y el historial de migraciones. Solo úsalo en desarrollo.

---

## 📚 Recursos Adicionales

- [Documentación oficial de Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Troubleshooting Prisma Migrate](https://www.prisma.io/docs/guides/migrate/troubleshooting-development)
- [Prisma Migrate Deploy](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)

---

## 💡 Tips Rápidos

1. **Siempre ejecuta `prisma generate` después de cambiar el schema**
2. **En producción, usa `migrate deploy` en lugar de `migrate dev`**
3. **Si trabajas en equipo, nunca edites migraciones ya aplicadas**
4. **Usa `migrate status` frecuentemente para verificar el estado**
5. **Mantén el schema.prisma como fuente de verdad**

---

## 🐛 Reportar Problemas

Si encuentras un problema que no está cubierto en esta guía:

1. Ejecuta `npm run prisma:status` y guarda la salida
2. Ejecuta `npx prisma validate` y guarda cualquier error
3. Revisa los logs de la base de datos
4. Documenta los pasos que llevaron al problema
