import { z } from 'zod';
import { cuidSchema } from '../../utils/validation.js';

export const createMachineSchema = {
  body: z.object({
    name: z.string().min(1, 'name is required'),
    type: z.enum(['cardio', 'fuerza', 'peso libre', 'funcional', 'otro'], {
      message: 'type debe ser: cardio, fuerza, peso libre, funcional u otro',
    }),
    status: z.enum(['operativa', 'en mantenimiento', 'fuera de servicio'], {
      message: 'status debe ser: operativa, en mantenimiento o fuera de servicio',
    }),
    centerId: cuidSchema,
  }),
};

export const updateMachineSchema = {
  params: z.object({ id: cuidSchema }),
  body: z.object({
    name: z.string().min(1).optional(),
    type: z.enum(['cardio', 'fuerza', 'peso libre', 'funcional', 'otro']).optional(),
    status: z.enum(['operativa', 'en mantenimiento', 'fuera de servicio']).optional(),
    centerId: cuidSchema.optional(),
  }),
};

export const machineIdParamSchema = {
  params: z.object({ id: cuidSchema }),
};

export const centerIdParamSchema = {
  params: z.object({ centerId: cuidSchema }),
};

