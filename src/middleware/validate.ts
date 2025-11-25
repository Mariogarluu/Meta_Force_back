import type { Request, Response, NextFunction } from 'express';
import { z, type ZodTypeAny, ZodObject } from 'zod';

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
      if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
      req.body = parsed.data as any;
      return next();
    }

    if (isComposite(schema)) {
      if (schema.body) {
        const p = schema.body.safeParse(req.body);
        if (!p.success) return res.status(400).json({ errors: p.error.flatten() });
        req.body = p.data as any;
      }
      if (schema.params) {
        const p = schema.params.safeParse(req.params);
        if (!p.success) return res.status(400).json({ errors: p.error.flatten() });
        req.params = p.data as any;
      }
      if (schema.query) {
        const p = schema.query.safeParse(req.query);
        if (!p.success) return res.status(400).json({ errors: p.error.flatten() });
        req.query = p.data as any;
      }
      return next();
    }

    return res.status(500).json({ message: 'Invalid schema passed to validate()' });
  } catch (err: any) {
    return res.status(400).json({ message: 'Validation error', detail: err.message });
  }
};
