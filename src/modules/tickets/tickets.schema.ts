import { z } from 'zod';
import { cuidSchema } from '../../utils/validation.js';

/**
 * Esquema de validación Zod para la creación de un Ticket PÚBLICO.
 * Los campos 'full_name' y 'contact_email' son ahora obligatorios.
 */
export const createTicketSchema = z.object({
  title: z.string().min(5, 'El título es demasiado corto.').max(100, 'El título es demasiado largo.'),
  description: z.string().min(10, 'La descripción es demasiado corta.').max(5000, 'La descripción es demasiado larga.'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH'], 'La prioridad es inválida.').default('LOW'),
  full_name: z.string().min(2, 'El nombre completo es requerido.').max(100, 'El nombre es demasiado largo.'),
  contact_email: z.string().email('Debe ser un correo electrónico válido.').max(100, 'El correo es demasiado largo.'),
});


export const ticketIdParamSchema = z.object({
  id: z.string(),
});

export const updateTicketSchema = z.object({
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  status: z.enum(['OPEN', 'CLOSED', 'IN_PROGRESS']).optional(),
});