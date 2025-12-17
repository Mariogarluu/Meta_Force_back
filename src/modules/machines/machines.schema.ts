import { z } from 'zod';
import { cuidSchema } from '../../utils/validation.js';

export const createMachineTypeSchema = {
  body: z.object({
    name: z.string().min(1, 'name is required'),
    type: z.enum(['cardio', 'fuerza', 'peso libre', 'funcional', 'otro'], {
      message: 'type debe ser: cardio, fuerza, peso libre, funcional u otro',
    }),
  }).strict(),
};

export const updateMachineTypeSchema = {
  params: z.object({ id: cuidSchema }),
  body: z.object({
    name: z.string().min(1).optional(),
    type: z.enum(['cardio', 'fuerza', 'peso libre', 'funcional', 'otro']).optional(),
  }),
};

export const machineTypeIdParamSchema = {
  params: z.object({ id: cuidSchema }),
};

export const addMachineToCenterSchema = {
  params: z.object({ id: cuidSchema }), // id es el machineTypeId
  body: z.object({
    centerId: cuidSchema,
    quantity: z.coerce.number().int().min(1, 'quantity must be at least 1'),
    status: z.enum(['operativa', 'en mantenimiento', 'fuera de servicio'], {
      message: 'status debe ser: operativa, en mantenimiento o fuera de servicio',
    }).optional().default('operativa'),
  }).strict(),
};

export const updateMachineInCenterSchema = {
  params: z.object({
    id: cuidSchema, // machineTypeId
    centerId: cuidSchema,
    instanceNumber: z.coerce.number().int().min(1),
  }),
  body: z.object({
    status: z.enum(['operativa', 'en mantenimiento', 'fuera de servicio']).optional(),
  }),
};

export const removeMachineFromCenterSchema = {
  params: z.object({
    id: cuidSchema, // machineTypeId
    centerId: cuidSchema,
    instanceNumber: z.coerce.number().int().min(1),
  }),
};

// Schemas para instancias de máquinas (por ID directo)
export const updateMachineSchema = {
  params: z.object({ id: cuidSchema }), // ID de la instancia de máquina
  body: z.object({
    status: z.enum(['operativa', 'en mantenimiento', 'fuera de servicio']).optional(),
  }),
};

export const machineIdParamSchema = {
  params: z.object({ id: cuidSchema }),
};

export const centerIdParamSchema = {
  params: z.object({ centerId: cuidSchema }),
};