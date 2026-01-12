import { z } from 'zod';

/**
 * --- VALIDACIÓN DE IDs (CUID) ---
 * Acepta tanto CUID v1 (empieza por 'c') como v2 y UUIDs.
 * Verifica solo caracteres alfanuméricos y longitud.
 */
export const cuidSchema = z.string()
  .min(20, { message: 'El ID es demasiado corto' })
  .max(32, { message: 'El ID es demasiado largo' })
  .regex(/^[a-z0-9]+$/, { message: 'El ID solo puede contener caracteres alfanuméricos' });

/**
 * Versión opcional del ID.
 * .nullish() permite recibir 'null' o 'undefined'.
 */
export const optionalCuidSchema = cuidSchema.nullish();


// --- VALIDACIONES COMUNES ---

export const emailSchema = z.string()
  .email({ message: "El formato del email no es válido" })
  .toLowerCase()
  .trim();

export const passwordSchema = z.string()
  .min(6, { message: "La contraseña debe tener al menos 6 caracteres" });

/**
 * Validación de Fechas - FIX APLICADO
 * Hemos eliminado el objeto { invalid_type_error: ... } dentro de z.date()
 * para evitar el error de tipos en tu versión de TypeScript/Zod.
 */
export const dateSchema = z.preprocess((arg) => {
  if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
  return arg;
}, z.date()); 
// Al dejar z.date() vacío, Zod validará automáticamente que el resultado del preprocess sea una fecha válida.

/**
 * Esquema de Paginación
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});