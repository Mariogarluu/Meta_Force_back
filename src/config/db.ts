import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl } from './env.js';

// Obtener la URL de la base de datos
const databaseUrl = getDatabaseUrl();
// Log de la URL (sin mostrar la contraseña completa)
// const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':****@');
// console.log('🔗 Database URL configurada:', maskedUrl);
// console.log('🔗 Hostname extraído:', new URL(databaseUrl).hostname);

/**
 * Inicializa el cliente de Prisma.
 * Construye la DATABASE_URL desde las variables de entorno separadas o usa DATABASE_URL directamente.
 */
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});