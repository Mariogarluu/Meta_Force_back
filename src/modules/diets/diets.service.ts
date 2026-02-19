import { prisma } from '../../config/db.js';

/**
 * Crea una nueva dieta para un usuario.
 */
export async function createDiet(userId: string, data: {
  name: string;
  description?: string;
}) {
  return prisma.diet.create({
    data: {
      userId,
      name: data.name,
      description: data.description || null,
    },
    include: {
      meals: {
        include: {
          meal: true,
        },
        orderBy: [
          { dayOfWeek: 'asc' },
          { order: 'asc' },
        ],
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Lista todas las dietas.
 * Si se proporciona userId, lista solo las dietas de ese usuario.
 */
export async function listDiets(userId?: string | null) {
  const where = userId
    ? { userId }
    : {};

  return prisma.diet.findMany({
    where,
    include: {
      meals: {
        include: {
          meal: true,
        },
        orderBy: [
          { dayOfWeek: 'asc' },
          { order: 'asc' },
        ],
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Obtiene una dieta por su ID.
 */
export async function getDietById(id: string) {
  return prisma.diet.findUnique({
    where: { id },
    include: {
      meals: {
        include: {
          meal: true,
        },
        orderBy: [
          { dayOfWeek: 'asc' },
          { order: 'asc' },
        ],
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Actualiza una dieta existente.
 */
export async function updateDiet(id: string, data: {
  name?: string;
  description?: string;
}) {
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description || null;

  return prisma.diet.update({
    where: { id },
    data: updateData,
    include: {
      meals: {
        include: {
          meal: true,
        },
        orderBy: [
          { dayOfWeek: 'asc' },
          { order: 'asc' },
        ],
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Elimina una dieta y todas sus comidas asociadas.
 */
export async function deleteDiet(id: string) {
  return prisma.diet.delete({
    where: { id },
  });
}

/**
 * Agrega una comida a una dieta en un día y tipo de comida específicos.
 */
export async function addMealToDiet(dietId: string, data: {
  mealId: string;
  dayOfWeek: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  mealType: string; // "desayuno", "almuerzo", "comida", "merienda", "cena"
  order: number; // Orden en el día y tipo de comida (para arrastrar y soltar)
  quantity?: number;
  notes?: string;
}) {
  // Verificar que la dieta existe
  const diet = await prisma.diet.findUnique({ where: { id: dietId } });
  if (!diet) {
    throw new Error('Dieta no encontrada');
  }

  // Verificar que la comida existe
  const meal = await prisma.meal.findUnique({ where: { id: data.mealId } });
  if (!meal) {
    throw new Error('Comida no encontrada');
  }

  // Validar dayOfWeek (0-6)
  if (data.dayOfWeek < 0 || data.dayOfWeek > 6) {
    throw new Error('dayOfWeek debe estar entre 0 (Domingo) y 6 (Sábado)');
  }

  // Validar mealType
  const validMealTypes = ['desayuno', 'almuerzo', 'comida', 'merienda', 'cena'];
  if (!validMealTypes.includes(data.mealType.toLowerCase())) {
    throw new Error(`mealType debe ser uno de: ${validMealTypes.join(', ')}`);
  }

  return prisma.dietMeal.create({
    data: {
      dietId,
      mealId: data.mealId,
      dayOfWeek: data.dayOfWeek,
      mealType: data.mealType.toLowerCase(),
      order: data.order,
      quantity: data.quantity || null,
      notes: data.notes || null,
    },
    include: {
      meal: true,
    },
  });
}

/**
 * Agrega múltiples comidas a una dieta en una sola transacción.
 */
export async function addMealsToDiet(dietId: string, mealsData: Array<{
  mealId: string;
  dayOfWeek: number;
  mealType: string;
  order: number;
  quantity?: number;
  notes?: string;
}>) {
  // Verificar que la dieta existe
  const diet = await prisma.diet.findUnique({ where: { id: dietId } });
  if (!diet) {
    throw new Error('Dieta no encontrada');
  }

  const validMealTypes = ['desayuno', 'almuerzo', 'comida', 'merienda', 'cena'];

  // Validaciones previas
  for (const data of mealsData) {
    if (data.dayOfWeek < 0 || data.dayOfWeek > 6) {
      throw new Error(`dayOfWeek ${data.dayOfWeek} inválido. Debe estar entre 0 y 6.`);
    }
    if (!validMealTypes.includes(data.mealType.toLowerCase())) {
      throw new Error(`mealType '${data.mealType}' inválido.`);
    }
  }

  return prisma.$transaction(
    mealsData.map(data =>
      prisma.dietMeal.create({
        data: {
          dietId,
          mealId: data.mealId,
          dayOfWeek: data.dayOfWeek,
          mealType: data.mealType.toLowerCase(),
          order: data.order,
          quantity: data.quantity || null,
          notes: data.notes || null,
        },
        include: {
          meal: true,
        },
      })
    )
  );
}

/**
 * Actualiza una comida en una dieta.
 */
export async function updateDietMeal(id: string, data: {
  dayOfWeek?: number;
  mealType?: string;
  order?: number;
  quantity?: number | null;
  notes?: string | null;
}) {
  const updateData: any = {};
  if (data.dayOfWeek !== undefined) {
    if (data.dayOfWeek < 0 || data.dayOfWeek > 6) {
      throw new Error('dayOfWeek debe estar entre 0 (Domingo) y 6 (Sábado)');
    }
    updateData.dayOfWeek = data.dayOfWeek;
  }
  if (data.mealType !== undefined) {
    const validMealTypes = ['desayuno', 'almuerzo', 'comida', 'merienda', 'cena'];
    if (!validMealTypes.includes(data.mealType.toLowerCase())) {
      throw new Error(`mealType debe ser uno de: ${validMealTypes.join(', ')}`);
    }
    updateData.mealType = data.mealType.toLowerCase();
  }
  if (data.order !== undefined) updateData.order = data.order;
  if (data.quantity !== undefined) updateData.quantity = data.quantity;
  if (data.notes !== undefined) updateData.notes = data.notes;

  return prisma.dietMeal.update({
    where: { id },
    data: updateData,
    include: {
      meal: true,
    },
  });
}

/**
 * Elimina una comida de una dieta.
 */
export async function removeMealFromDiet(id: string) {
  return prisma.dietMeal.delete({
    where: { id },
  });
}

/**
 * Actualiza el orden de múltiples comidas (para arrastrar y soltar).
 */
export async function reorderDietMeals(dietId: string, meals: Array<{
  id: string;
  dayOfWeek: number;
  mealType: string;
  order: number;
}>) {
  // Verificar que la dieta existe
  const diet = await prisma.diet.findUnique({ where: { id: dietId } });
  if (!diet) {
    throw new Error('Dieta no encontrada');
  }

  // Actualizar cada comida
  const updates = meals.map(m =>
    prisma.dietMeal.update({
      where: { id: m.id },
      data: {
        dayOfWeek: m.dayOfWeek,
        mealType: m.mealType.toLowerCase(),
        order: m.order,
      },
    })
  );

  await Promise.all(updates);

  // Retornar la dieta actualizada
  return getDietById(dietId);
}

