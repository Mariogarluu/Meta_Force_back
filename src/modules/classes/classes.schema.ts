import { z } from 'zod';
import { cuidSchema } from '../../utils/validation.js';

export const createClassSchema = {
  body: z.object({
    name: z.string().min(1, 'name is required'),
    description: z.string().optional(),
  }),
};

export const addCenterToClassSchema = {
  params: z.object({ id: cuidSchema }),
  body: z.object({
    centerId: z.string(),
    trainerIds: z.array(z.string()).min(1, 'At least one trainer is required'),
    schedules: z.array(z.object({
      dayOfWeek: z.coerce.number().int().min(0).max(6), // Usar coerce para convertir string a number
      startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
      endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
    })).min(1, 'At least one schedule is required'),
  }),
};

export const updateClassSchema = {
  params: z.object({ id: cuidSchema }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    trainerIds: z.array(z.string()).min(1, 'At least one trainer is required').optional(),
    schedules: z.array(z.object({
      id: z.string().optional(),
      centerId: z.string(),
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
      endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
    })).optional(),
  }),
};

export const classIdParamSchema = {
  params: z.object({ id: cuidSchema }),
};

export const updateCenterInClassSchema = {
  params: z.object({ 
    id: cuidSchema,
    centerId: cuidSchema
  }),
  body: z.object({
    trainerIds: z.array(z.string()).min(1, 'At least one trainer is required').optional(),
    schedules: z.array(z.object({
      id: z.string().optional(),
      dayOfWeek: z.coerce.number().int().min(0).max(6),
      startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
      endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
    })).optional(),
  }),
};
