import { z } from 'zod';

export const createBodyWeightSchema = z.object({
  weight: z.number().positive('El peso debe ser positivo'),
  date: z.string().optional(), // Acepta YYYY-MM-DD
  notes: z.string().optional(),
});

export const createExerciseRecordSchema = z.object({
  exerciseId: z.string().cuid('ID de ejercicio inválido'),
  weight: z.number().positive('El peso debe ser positivo'),
  reps: z.number().int().positive('Las repeticiones deben ser positivas'),
  date: z.string().optional(), // Acepta YYYY-MM-DD
  notes: z.string().optional(),
});

export const getByUserIdParamSchema = z.object({
  params: z.object({
    userId: z.string().cuid('ID de usuario inválido'),
  }),
});

export const recordIdParamSchema = z.object({
  params: z.object({
    id: z.string().cuid('ID de registro inválido'),
  }),
});
