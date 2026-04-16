import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * =============================================================================
 * MIDDLEWARE DE VALIDACIÓN GLOBAL (ZOD)
 * =============================================================================
 * Este middleware centraliza la validación de todas las entradas de la API.
 * Utiliza la librería Zod para asegurar que los datos cumplen con el contrato
 * definido en los esquemas (Schemas).
 * 
 * Ventajas:
 * 1. Tipado estático automático a partir del esquema.
 * 2. Limpieza de campos no deseados (stripping).
 * 3. Mapeo de errores legible para el cliente.
 */

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Valida una parte específica de la Request (body, params o query).
 * @param schema - Esquema de Zod contra el que validar.
 * @param data - Los datos reales recibidos.
 * @param type - El origen de los datos (para el reporte de errores).
 */
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

/**
 * Middleware principal de validación.
 * Recibe un esquema de Zod o un objeto con múltiples esquemas (body, query, params).
 * Si la validación falla, retorna 400 Bad Request con los detalles del error.
 */
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