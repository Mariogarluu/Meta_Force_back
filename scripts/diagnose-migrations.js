import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function logSuccess(message) { console.log(`${colors.green}✅ ${message}${colors.reset}`); }
function logError(message) { console.log(`${colors.red}❌ ${message}${colors.reset}`); }
function logWarning(message) { console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`); }
function logInfo(message) { console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`); }

console.log('🔍 Diagnóstico de Migraciones de Prisma (Versión Optimizada)\n');
console.log('='.repeat(50));

console.log('\n1. Verificando archivos necesarios...');
const schemaPath = join(rootDir, 'prisma', 'schema.prisma');
if (existsSync(schemaPath)) {
  logSuccess('schema.prisma encontrado');
} else {
  logError('schema.prisma NO encontrado');
  process.exit(1);
}

console.log('\n2. Validando schema.prisma...');
try {
  execSync('npx prisma validate', { cwd: rootDir, stdio: 'pipe', encoding: 'utf-8' });
  logSuccess('Schema válido');
} catch (error) {
  logError('Schema inválido');
  console.log(error.stdout || error.message);
}

console.log('\n3. Verificando conexión a base de datos (DATABASE_URL)...');
try {
  execSync('npx prisma db pull --print', { cwd: rootDir, stdio: 'pipe', encoding: 'utf-8', timeout: 10000 });
  logSuccess('Conexión a base de datos exitosa vía DATABASE_URL');
} catch (error) {
  logError('No se pudo conectar a la base de datos');
  logInfo('Asegúrate de que DATABASE_URL en el .env sea correcta y el puerto 5432 esté abierto.');
}

console.log('\n4. Verificando estado de migraciones...');
try {
  const status = execSync('npx prisma migrate status', { cwd: rootDir, stdio: 'pipe', encoding: 'utf-8' });
  console.log(status);
  if (status.includes('up to date')) logSuccess('Migraciones sincronizadas');
} catch (error) {
  logWarning('Existen discrepancias en el historial de migraciones');
  console.log(error.stdout || error.message);
}

console.log('\n5. Verificando diferencias (Drift)...');
try {
  const diff = execSync('npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma', { cwd: rootDir, stdio: 'pipe', encoding: 'utf-8' });
  if (diff.trim() === '') {
    logSuccess('Schema y base de datos están físicamente sincronizados');
  } else {
    logWarning('Se detectaron cambios en el schema no aplicados a la base de datos:');
    console.log(diff);
  }
} catch (error) {
  logError('Error al comparar schema vs base de datos');
}

console.log('\n' + '='.repeat(50));
console.log('\n📋 ACCIONES RECOMENDADAS:\n');
logInfo('Si la BD está sincronizada pero las migraciones fallan:');
console.log('   → npx prisma migrate resolve --applied [NOMBRE_MIGRACION]\n');
logInfo('Si hay cambios pendientes en el schema:');
console.log('   → npx prisma migrate dev --name [DESCRIPCION]\n');