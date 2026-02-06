import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para deshabilitar completamente el caché del lado del cliente y proxies.
 * Esencial para APIs REST que manejan datos dinámicos o sensibles.
 */
export const noCache = (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};