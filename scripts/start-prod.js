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
  let host = DB_HOST || 'localhost';
  const port = DB_PORT || '5432';
  const database = DB_DATABASE;

  // En Render, las bases de datos internas pueden necesitar el hostname completo
  // Si el hostname termina en -a, puede ser necesario agregar .render.com o usar el hostname completo
  // Render proporciona el hostname correcto en DB_HOST, así que lo usamos tal cual
  // Si no tiene el formato completo, intentamos construir la URL interna de Render
  if (host.includes('dpg-') && !host.includes('.')) {
    // Hostname interno de Render PostgreSQL, puede necesitar el puerto interno
    // Render maneja esto automáticamente, pero asegurémonos de usar el hostname correcto
    console.log(`⚠️  Hostname de Render detectado: ${host}`);
  }

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
    // Nota: En Render, las bases de datos internas pueden no ser accesibles durante el build
    // Si falla, las migraciones se ejecutarán al iniciar el servidor
    try {
      await runCommand('npx', ['prisma', 'migrate', 'deploy']);
    } catch (migrateError) {
      console.warn('⚠️  Advertencia: No se pudieron ejecutar las migraciones durante el build');
      console.warn('   Las migraciones se intentarán ejecutar al iniciar el servidor');
      console.warn(`   Error: ${migrateError.message}`);
      // Continuar con el inicio del servidor, las migraciones se ejecutarán en runtime
    }

    // 4. Iniciar servidor
    await runCommand('npm', ['start']);
  } catch (error) {
    console.error('❌ Error en start:prod:', error.message);
    process.exit(1);
  }
}

// Ejecutar
main();

