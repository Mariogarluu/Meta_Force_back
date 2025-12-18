import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env.js';

const isProduction = env.NODE_ENV === 'production';
const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Meta-Force API',
    version: '1.0.0',
    description: 'Documentación oficial de la API de Meta-Force Gym Management System',
  },
  servers: vercelUrl 
    ? [
        {
          url: vercelUrl,
          description: 'Servidor en Vercel (Auto-detectado)',
        }
      ]
    : [
        {
          url: `http://localhost:${env.PORT || 3000}`,
          description: 'Servidor de Desarrollo Local',
        }
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