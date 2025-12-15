import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : env.PORT;
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

  const server = app.listen(port, host, () => {
    logger.info(`API escuchando en http://${host}:${port}`);
    logger.info(`Entorno: ${env.NODE_ENV}`);
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