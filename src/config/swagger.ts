import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';

const isProduction = process.env['NODE_ENV'] === 'production';
const port = process.env['PORT'] || 3000;

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
          url: `http://localhost:${port}`,
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
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options: swaggerJSDoc.Options = {
  swaggerDefinition,
  apis: [
    // Escaneo de rutas y esquemas en estructura modular (Development TS)
    path.join(process.cwd(), 'src/modules/**/*.routes.ts'),
    path.join(process.cwd(), 'src/modules/**/*.schema.ts'),
    // Soporte para archivos compilados (Production JS)
    path.join(process.cwd(), 'dist/modules/**/*.routes.js'),
    path.join(process.cwd(), 'dist/modules/**/*.schema.js'),
  ],
};

export const swaggerSpec = swaggerJSDoc(options);