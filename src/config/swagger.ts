import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env.js';
import path from 'path';

const isProduction = env.NODE_ENV === 'production';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Meta-Force API',
    version: '1.0.0',
    description: 'Documentación oficial de la API de Meta-Force Gym Management System',
  },
  servers: isProduction
    ? [
        {
          url: 'https://meta-force-back.vercel.app',
          description: 'Servidor de Producción',
        },
      ]
    : [
        {
          url: `http://localhost:${env.PORT || 3000}`,
          description: 'Servidor de Desarrollo Local',
        },
      ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

const options: swaggerJSDoc.Options = {
  swaggerDefinition,
  apis: [
    path.join(process.cwd(), 'src/modules/**/*.routes.{ts,js}'),
    path.join(process.cwd(), 'dist/modules/**/*.routes.js'),
    path.join(process.cwd(), 'src/modules/**/*.schema.{ts,js}'),
    path.join(process.cwd(), 'dist/modules/**/*.schema.js'),
  ],
};

export const swaggerSpec = swaggerJSDoc(options);