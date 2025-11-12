import type { Request, Response, NextFunction } from 'express';
import { z, type ZodTypeAny, ZodObject } from 'zod';

type CompositeSchema = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

// Detecta si el argumento es un ZodObject "plano" (para body)
function isPlainZodObject(schema: any): schema is ZodObject<any> {
  return !!schema && typeof schema === 'object' && typeof schema.safeParse === 'function' && schema instanceof ZodObject;
}

// Detecta si el argumento es un objeto compuesto { body?, params?, query? }
function isComposite(schema: any): schema is CompositeSchema {
  return !!schema && (schema.body || schema.params || schema.query);
}

/**
 * Middleware de validación flexible:
 * - Si recibe ZodObject -> valida req.body
 * - Si recibe { body?, params?, query? } -> valida cada parte
 */
export const validate = (schema: CompositeSchema | ZodObject<any>) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Caso 1: esquema plano -> validar body
    if (isPlainZodObject(schema)) {
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
      req.body = parsed.data as any;
      return next();
    }

    // Caso 2: compuesto -> validar cada parte presente
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

    // Si llega aquí, el schema no es válido
    return res.status(500).json({ message: 'Invalid schema passed to validate()' });
  } catch (err: any) {
    return res.status(400).json({ message: 'Validation error', detail: err.message });
  }
};
