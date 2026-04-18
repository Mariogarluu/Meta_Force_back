/**
 * Punto de entrada: app legacy o sunset según META_FORCE_API_MODE.
 */
import app from './app.js';
import sunsetApp from './supabase-sunset-app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const appToUse = process.env.META_FORCE_API_MODE === 'supabase' ? sunsetApp : app;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : env.PORT;
  const host = '0.0.0.0';

  const server = appToUse.listen(port, host, () => {
    logger.info(`----------------------------------------------------------`);
    logger.info(`API escuchando en: http://localhost:${port}`);
    logger.info(
      `Modo: ${process.env.META_FORCE_API_MODE === 'supabase' ? 'supabase (sunset /api)' : 'express'}`,
    );
    logger.info(`Entorno: ${env.NODE_ENV}`);
    logger.info(`----------------------------------------------------------`);
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM recibido, cerrando servidor...');
    server.close(() => {
      logger.info('Servidor cerrado');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT recibido, cerrando servidor...');
    server.close(() => {
      logger.info('Servidor cerrado');
      process.exit(0);
    });
  });
}

export default appToUse;
