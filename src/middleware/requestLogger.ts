import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * =============================================================================
 * MIDDLEWARE DE LOGGING DE PETICIONES (REQUEST LOGGER)
 * =============================================================================
 * Este middleware proporciona trazabilidad completa para cada entrada a la API.
 * 
 * Funcionalidades clave:
 * 1. Medición de latencia (tiempo de respuesta en ms).
 * 2. Clasificación por severidad según código de estado HTTP.
 * 3. Enriquecimiento de logs con el cuerpo de la petición (en desarrollo).
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Marcamos el inicio de la petición
  const start = Date.now();
  
  // Log detallado del request recibido (solo habilitado en entorno de desarrollo)
  if (process.env.NODE_ENV === 'development') { 
    logger.http(`${req.method} ${req.path} - Body inicial: ${JSON.stringify(req.body)}`);
  }
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.path} ${res.statusCode} ${duration}ms`;
    
    if (res.statusCode >= 500) {
      logger.error(message);
    } else if (res.statusCode >= 400) {
      // Para errores 4xx, también loguear el body de la respuesta si existe
      const responseBody = (res as any).locals?.responseBody;
      if (responseBody) {
        logger.warn(`${message} 
 - Response: ${JSON.stringify(responseBody)}`);
      } else {
        logger.warn(message);
      }
    } else {
      logger.http(message);
    }
  });
  next();
}