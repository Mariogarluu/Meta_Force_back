#!/usr/bin/env node

/**
 * Script de diagnóstico para problemas con migraciones de Prisma
 * 
 * Uso: node scripts/diagnose-migrations.js
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🔍 Diagnóstico de Migraciones de Prisma\n');
console.log('=' .repeat(50));

// Colores para la salida
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

// 1. Verificar que existe schema.prisma
console.log('\n1. Verificando archivos necesarios...');
const schemaPath = join(rootDir, 'prisma', 'schema.prisma');
if (existsSync(schemaPath)) {
  logSuccess('schema.prisma encontrado');
} else {
  logError('schema.prisma NO encontrado');
  process.exit(1);
}

// 2. Validar schema
console.log('\n2. Validando schema.prisma...');
try {
  execSync('npx prisma validate', { 
    cwd: rootDir, 
    stdio: 'pipe',
    encoding: 'utf-8'
  });
  logSuccess('Schema válido');
} catch (error) {
  logError('Schema inválido');
  console.log(error.stdout || error.message);
}

// 3. Verificar estado de migraciones
console.log('\n3. Verificando estado de migraciones...');
try {
  const status = execSync('npx prisma migrate status', { 
    cwd: rootDir, 
    stdio: 'pipe',
    encoding: 'utf-8'
  });
  
  if (status.includes('up to date')) {
    logSuccess('Migraciones al día');
  } else if (status.includes('following migration')) {
    logWarning('Hay migraciones pendientes');
    console.log(status);
  } else if (status.includes('failed')) {
    logError('Hay migraciones fallidas');
    console.log(status);
  } else {
    logInfo('Estado de migraciones:');
    console.log(status);
  }
} catch (error) {
  logError('Error al verificar estado de migraciones');
  console.log(error.stdout || error.message);
}

// 4. Verificar cliente de Prisma
console.log('\n4. Verificando cliente de Prisma...');
const clientPath = join(rootDir, 'node_modules', '@prisma', 'client');
if (existsSync(clientPath)) {
  logSuccess('Cliente de Prisma encontrado');
} else {
  logWarning('Cliente de Prisma NO encontrado. Ejecuta: npx prisma generate');
}

// 5. Verificar conexión a base de datos
console.log('\n5. Verificando conexión a base de datos...');
try {
  execSync('npx prisma db pull --print', { 
    cwd: rootDir, 
    stdio: 'pipe',
    encoding: 'utf-8',
    timeout: 5000
  });
  logSuccess('Conexión a base de datos exitosa');
} catch (error) {
  logError('No se pudo conectar a la base de datos');
  logInfo('Verifica que:');
  logInfo('  - La base de datos esté corriendo');
  logInfo('  - DATABASE_URL esté correctamente configurada en .env');
  logInfo('  - Las credenciales sean correctas');
}

// 6. Verificar diferencias entre schema y BD
console.log('\n6. Verificando diferencias entre schema y base de datos...');
try {
  const diff = execSync('npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma', { 
    cwd: rootDir, 
    stdio: 'pipe',
    encoding: 'utf-8'
  });
  
  if (diff.trim() === '') {
    logSuccess('Schema y base de datos están sincronizados');
  } else {
    logWarning('Hay diferencias entre schema y base de datos:');
    console.log(diff);
  }
} catch (error) {
  logInfo('No se pudo verificar diferencias (esto es normal si hay problemas de conexión)');
}

// 7. Verificar migraciones recientes
console.log('\n7. Migraciones encontradas:');
try {
  const { readdirSync } = await import('fs');
  const migrationsDir = join(rootDir, 'prisma', 'migrations');
  if (existsSync(migrationsDir)) {
    const migrations = readdirSync(migrationsDir)
      .filter(item => !item.includes('lock') && !item.includes('.'))
      .sort()
      .slice(-5); // Últimas 5 migraciones
    
    if (migrations.length > 0) {
      migrations.forEach(migration => {
        console.log(`   - ${migration}`);
      });
      logInfo(`Total: ${readdirSync(migrationsDir).filter(item => !item.includes('lock') && !item.includes('.')).length} migraciones`);
    } else {
      logWarning('No se encontraron migraciones');
    }
  }
} catch (error) {
  logError('Error al leer migraciones');
}

// Resumen y recomendaciones
console.log('\n' + '='.repeat(50));
console.log('\n📋 Resumen y Recomendaciones:\n');

console.log('Si hay problemas, sigue estos pasos:\n');

console.log('1. Si el schema es inválido:');
console.log('   → Corrige los errores en schema.prisma');
console.log('   → Ejecuta: npx prisma validate\n');

console.log('2. Si hay migraciones pendientes:');
console.log('   → Ejecuta: npm run prisma:migrate -- --name nombre_migracion\n');

console.log('3. Si hay migraciones fallidas:');
console.log('   → Revisa: npm run prisma:status');
console.log('   → Marca como resuelta: npx prisma migrate resolve --applied nombre_migracion\n');

console.log('4. Si schema y BD están desincronizados:');
console.log('   → Desarrollo: npx prisma db push');
console.log('   → Producción: npx prisma migrate deploy\n');

console.log('5. Si el cliente no está generado:');
console.log('   → Ejecuta: npm run prisma:generate\n');

console.log('📖 Para más información, consulta:');
console.log('   → back/docs/GUIA_MIGRACIONES_PRISMA.md\n');
