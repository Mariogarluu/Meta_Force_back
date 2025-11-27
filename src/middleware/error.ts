import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Middleware de manejo global de errores que captura todas las excepciones no controladas.
 * Registra el error en los logs con su stack trace y retorna una respuesta JSON con el mensaje de error.
 * Usa el status code del error si está disponible, de lo contrario retorna 500.
 */
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  logger.error(`${req.method} ${req.path} - ${err.message}`);
  logger.error(err.stack);
  
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Error interno' });
}

