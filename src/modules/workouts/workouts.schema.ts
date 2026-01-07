import { z } from 'zod';
import { cuidSchema, optionalCuidSchema } from '../../utils/validation.js';

export const createWorkoutSchema = {
  body: z.object({
    name: z.string().min(1, 'name is required'),
    description: z.string().optional(),
  }).strict(),
};

export const updateWorkoutSchema = {
  params: z.object({ id: cuidSchema }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
  }).strict(),
};

export const workoutIdParamSchema = {
  params: z.object({ id: cuidSchema }),
};

export const listWorkoutsQuerySchema = {
  query: z.object({
    userId: optionalCuidSchema,
  }).partial().passthrough(),
};

export const addExerciseToWorkoutSchema = {
  params: z.object({ id: cuidSchema }),
  body: z.object({
    exerciseId: cuidSchema,
    dayOfWeek: z.number().int().min(0).max(6), // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    order: z.number().int().min(0),
    sets: z.number().int().positive().optional(),
    reps: z.number().int().positive().optional(),
    weight: z.number().positive().optional(),
    duration: z.number().int().positive().optional(), // en segundos
    restSeconds: z.number().int().nonnegative().optional(),
    notes: z.string().optional(),
  }).strict(),
};

export const updateWorkoutExerciseSchema = {
  params: z.object({ exerciseId: cuidSchema }),
  body: z.object({
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    order: z.number().int().min(0).optional(),
    sets: z.number().int().positive().nullable().optional(),
    reps: z.number().int().positive().nullable().optional(),
    weight: z.number().positive().nullable().optional(),
    duration: z.number().int().positive().nullable().optional(),
    restSeconds: z.number().int().nonnegative().nullable().optional(),
    notes: z.string().nullable().optional(),
  }).strict(),
};

export const removeExerciseFromWorkoutSchema = {
  params: z.object({ exerciseId: cuidSchema }),
};

export const reorderWorkoutExercisesSchema = {
  params: z.object({ id: cuidSchema }),
  body: z.object({
    exercises: z.array(z.object({
      id: cuidSchema,
      dayOfWeek: z.number().int().min(0).max(6),
      order: z.number().int().min(0),
    })).min(1),
  }).strict(),
};

