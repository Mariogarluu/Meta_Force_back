import { z } from 'zod';
import { cuidSchema, optionalCuidSchema } from '../../utils/validation.js';

export const createDietSchema = {
  body: z.object({
    name: z.string().min(1, 'name is required'),
    description: z.string().optional(),
  }).strict(),
};

export const updateDietSchema = {
  params: z.object({ id: cuidSchema }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
  }).strict(),
};

export const dietIdParamSchema = {
  params: z.object({ id: cuidSchema }),
};

export const listDietsQuerySchema = {
  query: z.object({
    userId: optionalCuidSchema,
  }).partial().passthrough(),
};

export const addMealToDietSchema = {
  params: z.object({ id: cuidSchema }),
  body: z.object({
    mealId: cuidSchema,
    dayOfWeek: z.number().int().min(0).max(6), // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    mealType: z.enum(['desayuno', 'almuerzo', 'comida', 'merienda', 'cena']),
    order: z.number().int().min(0),
    quantity: z.number().positive().optional(),
    notes: z.string().optional(),
  }).strict(),
};

export const updateDietMealSchema = {
  params: z.object({ mealId: cuidSchema }),
  body: z.object({
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    mealType: z.enum(['desayuno', 'almuerzo', 'comida', 'merienda', 'cena']).optional(),
    order: z.number().int().min(0).optional(),
    quantity: z.number().positive().nullable().optional(),
    notes: z.string().nullable().optional(),
  }).strict(),
};

export const removeMealFromDietSchema = {
  params: z.object({ mealId: cuidSchema }),
};

export const reorderDietMealsSchema = {
  params: z.object({ id: cuidSchema }),
  body: z.object({
    meals: z.array(z.object({
      id: cuidSchema,
      dayOfWeek: z.number().int().min(0).max(6),
      mealType: z.enum(['desayuno', 'almuerzo', 'comida', 'merienda', 'cena']),
      order: z.number().int().min(0),
    })).min(1),
  }).strict(),
};

