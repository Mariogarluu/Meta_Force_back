// src/config/swagger.js
import swaggerJSDoc from 'swagger-jsdoc';

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'Meta-Force API',
    version: '1.0.0',
    description:
      'API de ejemplo con Auth, Users, Centers y Classes. Protegida con JWT, validada con Zod.',
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      // --- USERS (ya los tienes, los dejo como referencia) ---
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          email: { type: 'string' },
          name: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          centerId: { type: 'integer', nullable: true },
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['email', 'name', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          password: { type: 'string', minLength: 8 },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          token: { type: 'string' },
        },
      },
      UpdateProfileInput: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
      },
      ChangePasswordInput: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 8 },
        },
      },
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          errors: { type: 'object' },
        },
      },

      // --- CENTERS ---
      CreateCenterInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          address: { type: 'string' },
          city: { type: 'string' },
          country: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
      },
      UpdateCenterInput: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          address: { type: 'string' },
          city: { type: 'string' },
          country: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
      },

      // --- CLASSES ---
      CreateClassInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
        },
      },
      UpdateClassInput: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
  },
  tags: [
    { name: 'Auth', description: 'Endpoints de autenticación' },
    { name: 'Users', description: 'Gestión de usuarios' },
    { name: 'Centers', description: 'Gestión de centros (gimnasios)' },
    { name: 'Classes', description: 'Gestión de clases' },
  ],
  security: [{ bearerAuth: [] }],
};

// 🔥 IMPORTANTE: incluye **todas** tus rutas .ts (si ejecutas TS con ts-node)
// Si ejecutas desde `dist`, cambia a 'dist/modules/**/*.routes.js'
const apis = [
  'src/modules/**/*.routes.ts',
  'src/modules/**/*.controller.ts',
  'src/modules/**/*.schema.ts',
  'src/modules/**/*.routes.js',       // por si en runtime cargas .js
];

export const swaggerSpec = swaggerJSDoc({
  definition,
  apis,
});
