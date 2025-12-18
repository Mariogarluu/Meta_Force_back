import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env.js';

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
          description: 'Servidor de Producción (Vercel)',
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
  apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.schema.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);