import type { Request, Response } from 'express';
import { prisma } from '../../config/db.js';

/**
 * @desc    Verifica el estado del servidor y la conexión a la base de datos.
 * @route   GET /api/health
 */
export const checkHealth = async (req: Request, res: Response) => {
  try {
    // Consulta mínima a la base de datos (Prisma realiza un SELECT 1).
    // Si esta consulta falla, significa que la BD está caída o la conexión es incorrecta.
    await prisma.$queryRaw`SELECT 1`; 

    // Si la consulta es exitosa, el servidor y la BD están OK.
    const healthcheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: new Date().toISOString(),
      database: 'Connected',
      environment: process.env.NODE_ENV,
    };
    
    res.status(200).json(healthcheck);
  } catch (error) {
    // Si hay un error, el servidor está vivo pero la DB está caída.
    const errorHealthCheck = {
      uptime: process.uptime(),
      message: 'Service Unavailable',
      timestamp: new Date().toISOString(),
      database: 'Disconnected',
      error: (error as Error).message,
    };
    
    // Devolvemos el estado 503 (Servicio no disponible)
    res.status(503).json(errorHealthCheck);
  }
};