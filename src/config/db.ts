import { PrismaClient } from '@prisma/client';

/**
 * Inicializa el cliente de Prisma.
 * PrismaClient leerá la DATABASE_URL de las variables de entorno cargadas.
 */
export const prisma = new PrismaClient();