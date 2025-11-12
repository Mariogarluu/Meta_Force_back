import { z } from 'zod';

export const createMachineSchema = {
  body: z.object({
    name: z.string().min(1, 'name is required'),
    type: z.enum(['cardio', 'fuerza', 'peso libre', 'funcional', 'otro'], {
      errorMap: () => ({ message: 'type debe ser: cardio, fuerza, peso libre, funcional u otro' }),
    }),
    status: z.enum(['operativa', 'en mantenimiento', 'fuera de servicio'], {
      errorMap: () => ({ message: 'status debe ser: operativa, en mantenimiento o fuera de servicio' }),
    }),
    centerId: z.number().int().positive('centerId debe ser un número positivo'),
  }),
};

export const updateMachineSchema = {
  params: z.object({ id: z.string().regex(/^\d+$/, 'ID inválido') }),
  body: z.object({
    name: z.string().min(1).optional(),
    type: z.enum(['cardio', 'fuerza', 'peso libre', 'funcional', 'otro']).optional(),
    status: z.enum(['operativa', 'en mantenimiento', 'fuera de servicio']).optional(),
    centerId: z.number().int().positive().optional(),
  }),
};

export const machineIdParamSchema = {
  params: z.object({ id: z.string().regex(/^\d+$/, 'ID inválido') }),
};

