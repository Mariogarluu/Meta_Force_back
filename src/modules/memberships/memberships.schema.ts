import { z } from 'zod';
import { cuidSchema } from '../../utils/validation.js';

export const createMembershipPlanSchema = {
  body: z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    description: z.string().optional(),
    price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
    duration: z.number().int().min(1, 'La duración debe ser al menos 1 mes'),
    features: z.array(z.string()).default([]),
    isActive: z.boolean().optional().default(true),
  }),
};

export const updateMembershipPlanSchema = {
  params: z.object({ id: cuidSchema }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.number().min(0).optional(),
    duration: z.number().int().min(1).optional(),
    features: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }),
};

export const membershipPlanIdParamSchema = {
  params: z.object({ id: cuidSchema }),
};

