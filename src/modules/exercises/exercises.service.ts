import { prisma } from '../../config/db.js';

/**
 * Crea un nuevo ejercicio en el banco de ejercicios.
 */
export async function createExercise(data: {
  name: string;
  description?: string;
  instructions?: string;
  imageUrl?: string;
  videoUrl?: string;
  machineTypeId?: string;
}) {
  return prisma.exercise.create({
    data: {
      name: data.name,
      description: data.description || null,
      instructions: data.instructions || null,
      imageUrl: data.imageUrl || null,
      videoUrl: data.videoUrl || null,
      machineTypeId: data.machineTypeId || null,
    },
    include: {
      machineType: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });
}

/**
 * Lista todos los ejercicios del banco.
 * Puede filtrar por tipo de máquina si se proporciona machineTypeId.
 */
export async function listExercises(machineTypeId?: string | null) {
  const where = machineTypeId
    ? { machineTypeId }
    : {};

  return prisma.exercise.findMany({
    where,
    include: {
      machineType: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Obtiene un ejercicio por su ID.
 */
export async function getExerciseById(id: string) {
  return prisma.exercise.findUnique({
    where: { id },
    include: {
      machineType: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });
}

/**
 * Actualiza un ejercicio existente.
 */
export async function updateExercise(id: string, data: {
  name?: string;
  description?: string;
  instructions?: string;
  imageUrl?: string;
  videoUrl?: string;
  machineTypeId?: string | null;
}) {
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.instructions !== undefined) updateData.instructions = data.instructions || null;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null;
  if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl || null;
  if (data.machineTypeId !== undefined) updateData.machineTypeId = data.machineTypeId || null;

  return prisma.exercise.update({
    where: { id },
    data: updateData,
    include: {
      machineType: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });
}

/**
 * Elimina un ejercicio del banco.
 * Esta operación no afecta los entrenamientos existentes que usan este ejercicio.
 */
export async function deleteExercise(id: string) {
  return prisma.exercise.delete({
    where: { id },
  });
}

/**
 * Importa múltiples ejercicios desde un array JSON.
 * Crea los ejercicios y devuelve información sobre cuántos se crearon exitosamente.
 */
export async function importExercises(exercises: Array<{
  name: string;
  description?: string;
  instructions?: string;
  imageUrl?: string;
  videoUrl?: string;
  machineTypeId?: string;
}>) {
  const results = {
    created: 0,
    skipped: 0,
    errors: [] as Array<{ exercise: string; error: string }>,
  };

  for (const exerciseData of exercises) {
    try {
      // Verificar si ya existe un ejercicio con el mismo nombre
      const existing = await prisma.exercise.findFirst({
        where: { name: exerciseData.name },
      });

      if (existing) {
        results.skipped++;
        continue;
      }

      await prisma.exercise.create({
        data: {
          name: exerciseData.name,
          description: exerciseData.description || null,
          instructions: exerciseData.instructions || null,
          imageUrl: exerciseData.imageUrl || null,
          videoUrl: exerciseData.videoUrl || null,
          machineTypeId: exerciseData.machineTypeId || null,
        },
      });

      results.created++;
    } catch (error: any) {
      results.errors.push({
        exercise: exerciseData.name,
        error: error.message || 'Error desconocido',
      });
    }
  }

  return results;
}

