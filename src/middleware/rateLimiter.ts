import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';

/**
 * Limitador de tasa general para todas las rutas de la API.
 * Permite máximo 100 peticiones por IP en una ventana de 15 minutos.
 * Útil para prevenir abuso general de la API.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Demasiadas peticiones desde esta IP, intenta de nuevo en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
  // Deshabilitar validación de trust proxy ya que está configurado correctamente en app.ts
  validate: {
    trustProxy: false,
  },
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
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Demasiados intentos de autenticación, intenta de nuevo en 15 minutos' },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  // Deshabilitar validación de trust proxy ya que está configurado correctamente en app.ts
  validate: {
    trustProxy: false,
  },
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for ${req.ip} on ${req.method} ${req.path}`);
    logger.warn(`Request body: ${JSON.stringify(req.body)}`);
    res.status(429).json({ message: 'Demasiados intentos de autenticación, intenta de nuevo en 15 minutos' });
  },
});

