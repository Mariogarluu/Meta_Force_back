import { z } from 'zod';
import { cuidSchema } from '../../utils/validation.js';

export const createCenterSchema = {
  body: z.object({
    name: z.string().min(1, 'name is required'),
    description: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Email inválido').optional(),
  }),
};

export const updateCenterSchema = {
  params: z.object({ id: cuidSchema }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Email inválido').optional(),
  }),
};

export const centerIdParamSchema = {
  params: z.object({ id: cuidSchema }),
};
