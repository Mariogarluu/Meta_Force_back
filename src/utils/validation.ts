import { z } from 'zod';

/**
 * Schema de validación Zod para CUIDs (Collision-resistant Unique Identifier).
 * Valida que el string tenga exactamente 25 caracteres, empiece con 'c' y continúe con 24 caracteres alfanuméricos en minúsculas.
 * Utilizado para validar IDs de parámetros de ruta y cuerpos de peticiones.
 */
export const cuidSchema = z.string().regex(/^c[a-z0-9]{24}$/, {
  message: 'ID inválido: debe ser un CUID válido'
});

/**
 * Schema de validación Zod para CUIDs opcionales.
 * Aplica la misma validación que cuidSchema pero permite valores undefined o null.
 * Útil para campos opcionales que cuando están presentes deben ser CUIDs válidos.
 */
export const optionalCuidSchema = z.string().regex(/^c[a-z0-9]{24}$/, {
  message: 'ID inválido: debe ser un CUID válido'
}).optional();

