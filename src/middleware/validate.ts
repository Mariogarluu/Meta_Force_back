import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

const validatePart = (schema: ZodSchema, data: any, type: string): { success: boolean; data?: any; error?: any } => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  // Mapeo simplificado de errores
  const formattedError = result.error.issues.map((issue) => ({
    field: issue.path.join('.') || type,
    message: issue.message,
  }));

  return { success: false, error: formattedError };
};

export const validate = (schema: ValidationSchemas | ZodSchema) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Normalización: Siempre trabajamos con un objeto ValidationSchemas
    const schemas: ValidationSchemas = 
      'safeParse' in schema 
        ? { body: schema as ZodSchema } 
        : schema as ValidationSchemas;

    if (schemas.body) {
      const result = validatePart(schemas.body, req.body, 'body');
      if (!result.success) {
        return res.status(400).json({
          error: true,
          message: 'Validation Error (Body)',
          code: 'VALIDATION_ERROR',
          details: result.error,
        });
      }
      req.body = result.data;
    }

    if (schemas.params) {
      const result = validatePart(schemas.params, req.params, 'params');
      if (!result.success) {
        return res.status(400).json({
          error: true,
          message: 'Validation Error (Params)',
          code: 'VALIDATION_ERROR',
          details: result.error,
        });
      }
      req.params = result.data;
    }

    if (schemas.query) {
      const result = validatePart(schemas.query, req.query, 'query');
      if (!result.success) {
        return res.status(400).json({
          error: true,
          message: 'Validation Error (Query)',
          code: 'VALIDATION_ERROR',
          details: result.error,
        });
      }
      req.query = result.data;
    }

    next();
  } catch (error) {
    // Log genérico del sistema, SIN exponer datos sensibles del usuario
    console.error('Middleware Validation System Error:', error);
    return res.status(500).json({ error: true, message: 'Internal Validation Error' });
  }
};