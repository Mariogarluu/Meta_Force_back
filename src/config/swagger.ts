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
  servers: [
    {
      url: process.env['VERCEL_URL']
        ? `https://${process.env['VERCEL_URL']}`
        : (isProduction ? 'https://meta-force-back.vercel.app' : `http://localhost:${port}`),
      description: isProduction ? 'Servidor de Producción' : 'Servidor Local',
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
    // Intentar buscar en src y dist, pero no crashear si no encuentra
    process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), 'api/**/*routes.js') // Fallback para structure tipo API
      : path.join(process.cwd(), 'src/modules/**/*.routes.ts'),

    path.join(process.cwd(), 'dist/modules/**/*.routes.js')
  ],
};

let swaggerSpec: object;

try {
  swaggerSpec = swaggerJSDoc(options);
  console.log('✅ Swagger Docs generados correctamente');
} catch (error) {
  console.error('❌ Error fatal al generar Swagger Docs:', error);
  // Fallback seguro para no tumbar la API
  swaggerSpec = {
    openapi: '3.0.0',
    info: swaggerDefinition.info,
    paths: {}
  };
}

export { swaggerSpec };