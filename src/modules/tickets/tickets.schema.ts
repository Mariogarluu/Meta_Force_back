import { z } from 'zod';
import { cuidSchema } from '../../utils/validation.js';

/**
 * Esquema de validación Zod para la creación de un Ticket PÚBLICO.
 * Valida los campos enviados desde el formulario de contacto (FormData).
 * Todos los campos vienen como strings desde FormData, por lo que se valida directamente.
 * Los campos opcionales pueden venir como strings vacíos desde FormData, por lo que se transforman a undefined.
 */
export const createTicketSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido.').max(100, 'El nombre es demasiado largo.'),
  email: z.string().email('Debe ser un correo electrónico válido.').max(100, 'El correo es demasiado largo.'),
  phone: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '') ? undefined : val,
    z.string().max(20, 'El teléfono es demasiado largo.').optional()
  ),
  centerId: cuidSchema,
  subject: z.string().min(5, 'El asunto es demasiado corto.').max(100, 'El asunto es demasiado largo.'),
  description: z.string().min(10, 'La descripción es demasiado corta.').max(5000, 'La descripción es demasiado larga.'),
});


export const ticketIdParamSchema = z.object({
  id: z.string(),
});

export const updateTicketSchema = z.object({
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  status: z.enum(['OPEN', 'CLOSED', 'IN_PROGRESS']).optional(),
});