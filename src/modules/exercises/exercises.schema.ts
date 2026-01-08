import { z } from 'zod';
import { cuidSchema, optionalCuidSchema } from '../../utils/validation.js';

export const createExerciseSchema = {
  body: z.object({
    name: z.string().min(1, 'name is required'),
    description: z.string().optional(),
    instructions: z.string().optional(),
    imageUrl: z.string().url().optional().or(z.literal('')),
    videoUrl: z.string().url().optional().or(z.literal('')),
    machineTypeId: optionalCuidSchema,
  }).strict(),
};

export const updateExerciseSchema = {
  params: z.object({ id: cuidSchema }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    instructions: z.string().optional(),
    imageUrl: z.string().url().optional().or(z.literal('')),
    videoUrl: z.string().url().optional().or(z.literal('')),
    machineTypeId: optionalCuidSchema,
  }).strict(),
};

export const exerciseIdParamSchema = {
  params: z.object({ id: cuidSchema }),
};

export const listExercisesQuerySchema = {
  // Acepta cualquier combinación de query params (o ninguno) para evitar errores 400
  // El controlador se encarga de interpretar opcionalmente machineTypeId si viene.
  query: z.any(),
};

export const importExercisesSchema = {
  body: z.object({
    exercises: z.array(z.object({
      name: z.string().min(1, 'name is required'),
      description: z.string().optional(),
      instructions: z.string().optional(),
      imageUrl: z.string().url().optional().or(z.literal('')),
      videoUrl: z.string().url().optional().or(z.literal('')),
      machineTypeId: optionalCuidSchema,
    })).min(1, 'El array de ejercicios no puede estar vacío'),
  }).strict(),
};

