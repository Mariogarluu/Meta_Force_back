import 'dotenv/config';
import { z } from 'zod';

/**
 * Esquema de validación para las variables de entorno del Servidor.
 * No incluye DATABASE_URL, ya que es gestionada directamente por Prisma.
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

  // CRÍTICO: Validamos que DATABASE_URL exista, aunque no la exportemos.
  DATABASE_URL: z.string().url('DATABASE_URL debe ser una URL de conexión válida.').nonempty(),
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
 * Excluimos DATABASE_URL del objeto exportado, pues solo la usa Prisma.
 */
// Utilizamos Omit de TypeScript para eliminar DATABASE_URL de la salida tipada.
export const env = envParseResult.data as Omit<z.infer<typeof envSchema>, 'DATABASE_URL'>;