import { z } from 'zod';
import { cuidSchema } from '../../utils/validation.js';

/**
 * Esquema de validación para los datos del código QR.
 * 
 * El QR debe contener:
 * - id: ID único del usuario (CUID)
 * - timestamp: Fecha y hora de generación en formato ISO datetime (para validar expiración)
 * 
 * Campos opcionales:
 * - email: Email del usuario (para información adicional)
 * - name: Nombre del usuario (para información adicional)
 * 
 * El timestamp se usa para validar que el QR no haya expirado (máximo 20 minutos).
 */
export const qrDataSchema = z.object({
  id: cuidSchema,
  email: z.string().email().optional(),
  name: z.string().optional(),
  timestamp: z.string().datetime()
});

/**
 * Esquema de validación para el body del endpoint POST /api/access/scan.
 * 
 * Requiere:
 * - qrData: Objeto con los datos del QR escaneado
 * - centerId: ID del centro donde se está escaneando el QR (CUID)
 * 
 * Este esquema valida que los datos del QR y el centro sean válidos antes de procesar.
 */
export const scanQRSchema = {
  body: z.object({
    qrData: qrDataSchema,
    centerId: cuidSchema
  })
};

/**
 * Tipo TypeScript inferido del esquema de escaneo de QR.
 * Se usa para tipado fuerte en los controladores y servicios.
 */
export type ScanQRInput = z.infer<typeof scanQRSchema.body>;

