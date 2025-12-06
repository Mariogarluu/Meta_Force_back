import type { Request, Response, NextFunction } from 'express';
import { z, type ZodTypeAny, ZodObject } from 'zod';
import { logger } from '../utils/logger.js';

type CompositeSchema = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

/**
 * Detecta si el schema proporcionado es un ZodObject plano usado para validar el body de la petición.
 */
function isPlainZodObject(schema: any): schema is ZodObject<any> {
  return !!schema && typeof schema === 'object' && typeof schema.safeParse === 'function' && schema instanceof ZodObject;
}

/**
 * Detecta si el schema proporcionado es un objeto compuesto que puede validar body, params y/o query por separado.
 */
function isComposite(schema: any): schema is CompositeSchema {
  return !!schema && (schema.body || schema.params || schema.query);
}

/**
 * Middleware de validación flexible que acepta schemas Zod simples o compuestos.
 * Si recibe un ZodObject simple, valida solo el body de la petición.
 * Si recibe un objeto compuesto con body, params y/o query, valida cada parte presente.
 * Retorna un error 400 con los detalles de validación si algún campo no cumple el schema.
 */
export const validate = (schema: CompositeSchema | ZodObject<any>) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (isPlainZodObject(schema)) {
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        // Formatear errores de Zod a un formato más legible
        const errors = parsed.error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        const firstError = errors[0];
        const errorMessage = firstError ? firstError.message : 'Error de validación';
        
        // Log del error de validación
        logger.warn(`Validation error on ${req.method} ${req.path}: ${errorMessage}`);
        logger.warn(`Request body: ${JSON.stringify(req.body)}`);
        logger.warn(`Validation errors: ${JSON.stringify(errors)}`);
        
        return res.status(400).json({ 
          message: errorMessage,
          errors: parsed.error.flatten()
        });
      }
      req.body = parsed.data as any;
      return next();
    }

    if (isComposite(schema)) {
      if (schema.body) {
        const p = schema.body.safeParse(req.body);
        if (!p.success) {
          const errors = p.error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }));
          const firstError = errors[0];
          return res.status(400).json({ 
            message: firstError ? firstError.message : 'Error de validación en body',
            errors: p.error.flatten()
          });
        }
        req.body = p.data as any;
      }
      if (schema.params) {
        const p = schema.params.safeParse(req.params);
        if (!p.success) {
          const errors = p.error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }));
          const firstError = errors[0];
          return res.status(400).json({ 
            message: firstError ? firstError.message : 'Error de validación en params',
            errors: p.error.flatten()
          });
        }
        req.params = p.data as any;
      }
      if (schema.query) {
        const p = schema.query.safeParse(req.query);
        if (!p.success) {
          const errors = p.error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }));
          const firstError = errors[0];
          return res.status(400).json({ 
            message: firstError ? firstError.message : 'Error de validación en query',
            errors: p.error.flatten()
          });
        }
        req.query = p.data as any;
      }
      return next();
    }

    return res.status(500).json({ message: 'Invalid schema passed to validate()' });
  } catch (err: any) {
    return res.status(400).json({ message: 'Validation error', detail: err.message });
  }
};
