import { prisma } from '../../config/db.js';

/**
 * Crea una nueva comida/receta en el banco de comidas.
 */
export async function createMeal(data: {
  name: string;
  description?: string;
  instructions?: string;
  imageUrl?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  fiber?: number;
}) {
  return prisma.meal.create({
    data: {
      name: data.name,
      description: data.description || null,
      instructions: data.instructions || null,
      imageUrl: data.imageUrl || null,
      calories: data.calories || null,
      protein: data.protein || null,
      carbs: data.carbs || null,
      fats: data.fats || null,
      fiber: data.fiber || null,
    },
  });
}

/**
 * Lista todas las comidas del banco.
 */
export async function listMeals() {
  return prisma.meal.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Obtiene una comida por su ID.
 */
export async function getMealById(id: string) {
  return prisma.meal.findUnique({
    where: { id },
  });
}

/**
 * Actualiza una comida existente.
 */
export async function updateMeal(id: string, data: {
  name?: string;
  description?: string;
  instructions?: string;
  imageUrl?: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fats?: number | null;
  fiber?: number | null;
}) {
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.instructions !== undefined) updateData.instructions = data.instructions || null;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null;
  if (data.calories !== undefined) updateData.calories = data.calories;
  if (data.protein !== undefined) updateData.protein = data.protein;
  if (data.carbs !== undefined) updateData.carbs = data.carbs;
  if (data.fats !== undefined) updateData.fats = data.fats;
  if (data.fiber !== undefined) updateData.fiber = data.fiber;

  return prisma.meal.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Elimina una comida del banco.
 * Esta operación no afecta las dietas existentes que usan esta comida.
 */
export async function deleteMeal(id: string) {
  return prisma.meal.delete({
    where: { id },
  });
}

/**
 * Importa múltiples comidas desde un array JSON.
 * Crea las comidas y devuelve información sobre cuántas se crearon exitosamente.
 */
export async function importMeals(meals: Array<{
  name: string;
  description?: string;
  instructions?: string;
  imageUrl?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  fiber?: number;
}>) {
  const results = {
    created: 0,
    skipped: 0,
    errors: [] as Array<{ meal: string; error: string }>,
  };

  for (const mealData of meals) {
    try {
      // Verificar si ya existe una comida con el mismo nombre
      const existing = await prisma.meal.findFirst({
        where: { name: mealData.name },
      });

      if (existing) {
        results.skipped++;
        continue;
      }

      await prisma.meal.create({
        data: {
          name: mealData.name,
          description: mealData.description || null,
          instructions: mealData.instructions || null,
          imageUrl: mealData.imageUrl || null,
          calories: mealData.calories || null,
          protein: mealData.protein || null,
          carbs: mealData.carbs || null,
          fats: mealData.fats || null,
          fiber: mealData.fiber || null,
        },
      });

      results.created++;
    } catch (error: any) {
      results.errors.push({
        meal: mealData.name,
        error: error.message || 'Error desconocido',
      });
    }
  }

  return results;
}

