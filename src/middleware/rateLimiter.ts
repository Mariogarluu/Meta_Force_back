import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';

/**
 * Limitador de tasa general para todas las rutas de la API.
 * Permite máximo 100 peticiones por IP en una ventana de 15 minutos.
 * Útil para prevenir abuso general de la API.
 * 
 * @see https://github.com/express-rate-limit/express-rate-limit
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 peticiones por ventana
  message: { message: 'Demasiadas peticiones desde esta IP, intenta de nuevo en 15 minutos' },
  standardHeaders: true, // Incluir headers RateLimit-* en la respuesta
  legacyHeaders: false, // No incluir headers X-RateLimit-*
  // Deshabilitar validación de trust proxy ya que está configurado correctamente en app.ts
  validate: {
    trustProxy: false,
  },
  /**
   * Handler personalizado que loguea cuando se excede el límite de tasa.
   * @param req - Request de Express
   * @param res - Response de Express
   */
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for ${req.ip} on ${req.method} ${req.path}`);
    res.status(429).json({ message: 'Demasiadas peticiones desde esta IP, intenta de nuevo en 15 minutos' });
  },
});

/**
 * Limitador de tasa específico para rutas de autenticación (login y registro).
 * Permite máximo 5 intentos por IP en una ventana de 15 minutos.
 * Solo cuenta los intentos fallidos, ignorando las peticiones exitosas.
 * Útil para prevenir ataques de fuerza bruta en autenticación.
 * 
 * @see https://github.com/express-rate-limit/express-rate-limit
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos por ventana
  message: { message: 'Demasiados intentos de autenticación, intenta de nuevo en 15 minutos' },
  skipSuccessfulRequests: true, // Solo cuenta intentos fallidos
  standardHeaders: true, // Incluir headers RateLimit-* en la respuesta
  legacyHeaders: false, // No incluir headers X-RateLimit-*
  // Deshabilitar validación de trust proxy ya que está configurado correctamente en app.ts
  validate: {
    trustProxy: false,
  },
  /**
   * Handler personalizado que loguea cuando se excede el límite de tasa en autenticación.
   * Incluye el body de la petición para debugging.
   * @param req - Request de Express
   * @param res - Response de Express
   */
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for ${req.ip} on ${req.method} ${req.path}`);
    logger.warn(`Request body: ${JSON.stringify(req.body)}`);
    res.status(429).json({ message: 'Demasiados intentos de autenticación, intenta de nuevo en 15 minutos' });
  },
});

