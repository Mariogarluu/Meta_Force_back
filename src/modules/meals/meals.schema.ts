import { z } from 'zod';
import { cuidSchema } from '../../utils/validation.js';

export const createMealSchema = {
  body: z.object({
    name: z.string().min(1, 'name is required'),
    description: z.string().optional(),
    instructions: z.string().optional(),
    imageUrl: z.string().url().optional().or(z.literal('')),
    calories: z.number().nonnegative().optional(),
    protein: z.number().nonnegative().optional(),
    carbs: z.number().nonnegative().optional(),
    fats: z.number().nonnegative().optional(),
    fiber: z.number().nonnegative().optional(),
  }).strict(),
};

export const updateMealSchema = {
  params: z.object({ id: cuidSchema }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    instructions: z.string().optional(),
    imageUrl: z.string().url().optional().or(z.literal('')),
    calories: z.number().nonnegative().nullable().optional(),
    protein: z.number().nonnegative().nullable().optional(),
    carbs: z.number().nonnegative().nullable().optional(),
    fats: z.number().nonnegative().nullable().optional(),
    fiber: z.number().nonnegative().nullable().optional(),
  }).strict(),
};

export const mealIdParamSchema = {
  params: z.object({ id: cuidSchema }),
};

export const importMealsSchema = {
  body: z.object({
    meals: z.array(z.object({
      name: z.string().min(1, 'name is required'),
      description: z.string().optional(),
      instructions: z.string().optional(),
      imageUrl: z.string().url().optional().or(z.literal('')),
      calories: z.number().nonnegative().optional(),
      protein: z.number().nonnegative().optional(),
      carbs: z.number().nonnegative().optional(),
      fats: z.number().nonnegative().optional(),
      fiber: z.number().nonnegative().optional(),
    })).min(1, 'El array de comidas no puede estar vacío'),
  }).strict(),
};

