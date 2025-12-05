import 'dotenv/config';
import { z } from 'zod';

/**
 * Establece DATABASE_URL en process.env ANTES de la validación
 * para que Prisma Studio y otros comandos de Prisma puedan encontrarla.
 * Esto debe hacerse de forma síncrona y temprana.
 */
function setupDatabaseUrl() {
  // Solo establecer si no existe y tenemos las variables necesarias
  if (!process.env.DATABASE_URL) {
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

  // Seguridad (BCrypt)
  BCRYPT_SALT_ROUNDS: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().int().min(10, 'El SALT_ROUNDS debe ser 10 o superior para un hashing seguro.'),
  ).default(10),

  // Database Configuration (variables separadas)
  DB_USER: z.string().min(1, 'DB_USER es requerido'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD es requerido'),
  DB_HOST: z.string().min(1, 'DB_HOST es requerido').default('localhost'),
  DB_PORT: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().positive().int().safe(),
  ).default(5432),
  DB_DATABASE: z.string().min(1, 'DB_DATABASE es requerido'),
});


// ----------------------------------------------------
// 1. VALIDACIÓN
// ----------------------------------------------------

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
 */
export function getDatabaseUrl(): string {
  const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_DATABASE } = env;
  return `postgresql://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}?schema=public`;
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