import 'dotenv/config';
import { z } from 'zod';

/**
 * Establece DATABASE_URL en process.env ANTES de la validación
 * para que Prisma Studio y otros comandos de Prisma puedan encontrarla.
 * Esto debe hacerse de forma síncrona y temprana.
 * 
 * Acepta dos formas de configuración:
 * 1. DATABASE_URL directamente (recomendado para Render - usa Internal Database URL)
 * 2. Variables separadas (DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_DATABASE)
 */
function setupDatabaseUrl() {
  // Si DATABASE_URL ya existe, no hacer nada (prioridad más alta)
  if (process.env.DATABASE_URL) {
    return;
  }

  // Si no existe, intentar construir desde variables separadas
  const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_DATABASE } = process.env;

  if (DB_USER && DB_PASSWORD && DB_DATABASE) {
    const user = encodeURIComponent(DB_USER);
    const password = encodeURIComponent(DB_PASSWORD);
    const host = DB_HOST || 'localhost';
    const port = DB_PORT || '5432';
    const database = DB_DATABASE;
    process.env.DATABASE_URL = `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public`;
  }
}

// Establecer DATABASE_URL inmediatamente (esto se ejecuta cuando se importa el módulo)
setupDatabaseUrl();

/**
 * Esquema de validación para las variables de entorno del Servidor.
 * Usa variables separadas para la base de datos en lugar de DATABASE_URL.
 */
const envSchema = z.object({
  // General Server
  PORT: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().positive().int().safe(),
  ).default(3000),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Seguridad y Requeridos
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres por seguridad.').nonempty(),
  GEMINI_API_KEY: z.string().optional(),

  // Seguridad (BCrypt)
  BCRYPT_SALT_ROUNDS: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().int().min(10, 'El SALT_ROUNDS debe ser 10 o superior para un hashing seguro.'),
  ).default(10),

  // Database Configuration (variables separadas - opcional si DATABASE_URL está definida)
  // Si DATABASE_URL está definida, estas variables son opcionales
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_HOST: z.string().optional(),
  DB_PORT: z.preprocess(
    (a) => {
      if (!a || a === '') return undefined;
      try {
        return parseInt(z.string().parse(a), 10);
      } catch {
        return undefined;
      }
    },
    z.number().positive().int().safe().optional(),
  ).optional(),
  DB_DATABASE: z.string().optional(),
});


// ----------------------------------------------------
// 1. VALIDACIÓN
// ----------------------------------------------------

// Validar que al menos DATABASE_URL o las variables de DB estén definidas
const hasDatabaseUrl = !!process.env.DATABASE_URL;
const hasSeparateDbVars = !!(process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_DATABASE);

if (!hasDatabaseUrl && !hasSeparateDbVars) {
  console.error('❌ Error CRÍTICO: Se requiere DATABASE_URL o las variables DB_USER, DB_PASSWORD y DB_DATABASE');
  throw new Error('Variables de entorno de base de datos inválidas. Se detiene el servidor.');
}

const envParseResult = envSchema.safeParse(process.env);

if (!envParseResult.success) {
  console.error('❌ Error CRÍTICO en las variables de entorno:');
  console.error(envParseResult.error.issues);
  throw new Error('Variables de entorno inválidas. Se detiene el servidor.');
}

/**
 * El objeto 'env' ahora está validado, tipado y listo para usar de forma segura.
 */
export const env = envParseResult.data;

/**
 * Construye la URL de conexión a la base de datos desde las variables de entorno separadas.
 * Formato: postgresql://user:password@host:port/database?schema=public
 * 
 * Si DATABASE_URL está definida directamente, la usa (recomendado para Render).
 * Si no, construye desde variables separadas.
 */
export function getDatabaseUrl(): string {
  // Prioridad 1: Usar DATABASE_URL directamente si existe
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Prioridad 2: Construir desde variables separadas
  const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_DATABASE } = env;
  if (!DB_USER || !DB_PASSWORD || !DB_DATABASE) {
    throw new Error('DB_USER, DB_PASSWORD y DB_DATABASE son requeridos para construir DATABASE_URL');
  }
  const host = DB_HOST || 'localhost';
  const port = DB_PORT || 5432;
  return `postgresql://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASSWORD)}@${host}:${port}/${DB_DATABASE}?schema=public`;
}

// Asegurar que DATABASE_URL esté establecida (por si acaso)
if (!process.env.DATABASE_URL) {
  try {
    process.env.DATABASE_URL = getDatabaseUrl();
  } catch (error) {
    // Si falla, significa que las variables no están validadas aún
    // pero setupDatabaseUrl() ya debería haberlo hecho
  }
}