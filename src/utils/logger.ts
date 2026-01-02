import winston from 'winston';
import { env } from '../config/env.js';

/**
 * Configuración de niveles de log para Winston.
 * Define la jerarquía de severidad de los mensajes de log.
 */
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

/**
 * Configuración de colores para cada nivel de log en la consola.
 * Facilita la identificación visual de los diferentes tipos de mensajes.
 */
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Definir los transportes (destinos de los logs)
const transports: winston.transport[] = [
  // La consola siempre está activa (Vercel captura esto automáticamente)
  new winston.transports.Console(),
];

// Solo agregar escritura a archivos si estamos en desarrollo local.
// En Vercel/Serverless el sistema de archivos es Read-Only y esto causaría un crash.
if (env.NODE_ENV === 'development') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    })
  );
  transports.push(
    new winston.transports.File({ filename: 'logs/all.log' })
  );
}

/**
 * Instancia configurada del logger Winston para toda la aplicación.
 * Registra mensajes en consola siempre.
 * Solo registra en archivos cuando NODE_ENV es 'development'.
 */
export const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'warn',
  levels,
  format,
  transports,
});