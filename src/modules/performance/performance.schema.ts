import { z } from 'zod';

export const createBodyWeightSchema = z.object({
  body: z.object({
    weight: z.number().positive('El peso debe ser positivo'),
    date: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),
});

export const createExerciseRecordSchema = z.object({
  body: z.object({
    exerciseId: z.string().cuid('ID de ejercicio inválido'),
    weight: z.number().positive('El peso debe ser positivo'),
    reps: z.number().int().positive('Las repeticiones deben ser positivas'),
    date: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),
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
