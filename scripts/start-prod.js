/**
 * Script wrapper para ejecutar el build y deploy en producción.
 * Establece DATABASE_URL desde variables separadas antes de ejecutar Prisma.
 */
import 'dotenv/config';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

/**
 * Establece DATABASE_URL en process.env desde las variables de entorno separadas.
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

/**
 * Ejecuta un comando y espera a que termine.
 */
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶️  Ejecutando: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: projectRoot,
      env: { ...process.env, ...options.env },
      ...options
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Comando falló con código ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Función principal que ejecuta todos los pasos en secuencia.
 */
async function main() {
  try {
    // 1. Establecer DATABASE_URL
    setupDatabaseUrl();

    // 2. Build TypeScript
    await runCommand('npm', ['run', 'build']);

    // 3. Prisma migrate deploy (DATABASE_URL está disponible en process.env)
    await runCommand('npx', ['prisma', 'migrate', 'deploy']);

    // 4. Iniciar servidor
    await runCommand('npm', ['start']);
  } catch (error) {
    console.error('❌ Error en start:prod:', error.message);
    process.exit(1);
  }
}

// Ejecutar
main();

