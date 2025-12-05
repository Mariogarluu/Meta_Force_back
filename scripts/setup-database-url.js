/**
 * Script para establecer DATABASE_URL en process.env desde variables separadas.
 * Este script se ejecuta antes de comandos de Prisma para asegurar que DATABASE_URL esté disponible.
 * Funciona tanto en desarrollo (leyendo .env) como en producción (usando variables de entorno).
 */
import 'dotenv/config';

/**
 * Establece DATABASE_URL en process.env desde las variables de entorno separadas.
 * Si DATABASE_URL ya existe, no la sobrescribe.
 */
function setupDatabaseUrl() {
  // Si DATABASE_URL ya existe, no hacer nada
  if (process.env.DATABASE_URL) {
    console.log('✅ DATABASE_URL ya está establecida');
    return;
  }

  const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_DATABASE } = process.env;

  if (!DB_USER || !DB_PASSWORD || !DB_DATABASE) {
    console.error('❌ Error: Faltan variables de entorno de base de datos');
    console.error('Se requieren: DB_USER, DB_PASSWORD, DB_DATABASE');
    console.error('Opcional: DB_HOST (default: localhost), DB_PORT (default: 5432)');
    process.exit(1);
  }

  const user = encodeURIComponent(DB_USER);
  const password = encodeURIComponent(DB_PASSWORD);
  const host = DB_HOST || 'localhost';
  const port = DB_PORT || '5432';
  const database = DB_DATABASE;

  process.env.DATABASE_URL = `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public`;
  console.log('✅ DATABASE_URL establecida desde variables separadas');
  console.log(`   Host: ${host}:${port}`);
  console.log(`   Database: ${database}`);
  console.log(`   User: ${user}`);
}

// Ejecutar inmediatamente
setupDatabaseUrl();

