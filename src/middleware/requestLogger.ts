import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Middleware que registra todas las peticiones HTTP recibidas con su método, ruta, código de estado y tiempo de respuesta.
 * Usa diferentes niveles de log según el código de estado: error para 5xx, warn para 4xx, http para exitosas.
 * Mide el tiempo transcurrido desde que se recibe la petición hasta que se completa la respuesta.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.path} ${res.statusCode} ${duration}ms`;
    
    if (res.statusCode >= 500) {
      logger.error(message);
    } else if (res.statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.http(message);
    }
  });
  
  next();
}

