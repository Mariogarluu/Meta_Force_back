/**
 * Script helper para establecer DATABASE_URL desde variables separadas
 * antes de ejecutar comandos de Prisma (Studio, Migrate, etc.)
 */
import 'dotenv/config';
import { spawn } from 'child_process';

const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_DATABASE } = process.env;

// Establecer DATABASE_URL si no existe y tenemos las variables necesarias
if (!process.env.DATABASE_URL) {
  if (!DB_USER || !DB_PASSWORD || !DB_DATABASE) {
    console.error('❌ Error: Faltan variables de entorno de base de datos');
    console.error('Se requieren: DB_USER, DB_PASSWORD, DB_DATABASE');
    console.error('O establece DATABASE_URL directamente en el .env');
    process.exit(1);
  }

  const user = encodeURIComponent(DB_USER);
  const password = encodeURIComponent(DB_PASSWORD);
  const host = DB_HOST || 'localhost';
  const port = DB_PORT || '5432';
  const database = DB_DATABASE;

  process.env.DATABASE_URL = `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public`;
  console.log('✅ DATABASE_URL establecida desde variables separadas');
}

// Ejecutar el comando de Prisma pasado como argumento
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Error: Se requiere un comando de Prisma');
  process.exit(1);
}

// Pasar DATABASE_URL explícitamente al proceso hijo
const child = spawn('npx', ['prisma', ...args], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL
  }
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
