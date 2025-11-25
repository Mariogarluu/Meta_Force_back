import swaggerJSDoc from 'swagger-jsdoc';

/**
 * Configuración principal de Swagger para la documentación de la API.
 * Define la estructura OpenAPI 3.0.3 con todos los schemas y endpoints disponibles.
 */
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

      Machine: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          type: { type: 'string', enum: ['cardio', 'fuerza', 'peso libre', 'funcional', 'otro'] },
          status: { type: 'string', enum: ['operativa', 'en mantenimiento', 'fuera de servicio'] },
          centerId: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          center: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              city: { type: 'string' },
            },
          },
        },
      },
      CreateMachineInput: {
        type: 'object',
        required: ['name', 'type', 'status', 'centerId'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['cardio', 'fuerza', 'peso libre', 'funcional', 'otro'] },
          status: { type: 'string', enum: ['operativa', 'en mantenimiento', 'fuera de servicio'] },
          centerId: { type: 'integer' },
        },
      },
      UpdateMachineInput: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['cardio', 'fuerza', 'peso libre', 'funcional', 'otro'] },
          status: { type: 'string', enum: ['operativa', 'en mantenimiento', 'fuera de servicio'] },
          centerId: { type: 'integer' },
        },
      },
    },
  },
  tags: [
    { name: 'Auth', description: 'Endpoints de autenticación' },
    { name: 'Users', description: 'Gestión de usuarios' },
    { name: 'Centers', description: 'Gestión de centros (gimnasios)' },
    { name: 'Classes', description: 'Gestión de clases' },
    { name: 'Machines', description: 'Gestión de máquinas de gimnasio' },
  ],
  security: [{ bearerAuth: [] }],
};

/**
 * Especifica las rutas donde Swagger buscará los comentarios de documentación JSDoc.
 * Incluye archivos TypeScript y JavaScript para soportar diferentes entornos de ejecución.
 */
const apis = [
  'src/modules/**/*.routes.ts',
  'src/modules/**/*.controller.ts',
  'src/modules/**/*.schema.ts',
  'src/modules/**/*.routes.js',
];

/**
 * Especificación completa de Swagger generada a partir de la definición y los archivos de rutas.
 * Exporta la configuración de Swagger para ser utilizada por el middleware de Swagger UI.
 */
export const swaggerSpec = swaggerJSDoc({
  definition,
  apis,
});
