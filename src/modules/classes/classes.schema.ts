import { z } from 'zod';
import { cuidSchema } from '../../utils/validation.js';

export const createClassSchema = {
  body: z.object({
    name: z.string().min(1, 'name is required'),
    description: z.string().optional(),
  }),
};

export const updateClassSchema = {
  params: z.object({ id: cuidSchema }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
  }),
};

export const classIdParamSchema = {
  params: z.object({ id: cuidSchema }),
};
