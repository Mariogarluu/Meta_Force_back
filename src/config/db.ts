import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl } from './env.js';

/**
 * Inicializa el cliente de Prisma.
 * Construye la DATABASE_URL desde las variables de entorno separadas.
 */
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
});