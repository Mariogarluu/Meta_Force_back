import { prisma } from '../../config/db.js';

/**
 * Crea un nuevo entrenamiento para un usuario.
 */
export async function createWorkout(userId: string, data: {
  name: string;
  description?: string;
}) {
  return prisma.workout.create({
    data: {
      userId,
      name: data.name,
      description: data.description || null,
    },
    include: {
      exercises: {
        include: {
          exercise: {
            include: {
              machineType: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
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
 * Lista todos los entrenamientos.
 * Si se proporciona userId, lista solo los entrenamientos de ese usuario.
 */
export async function listWorkouts(userId?: string | null) {
  const where = userId
    ? { userId }
    : {};

  return prisma.workout.findMany({
    where,
    include: {
      exercises: {
        include: {
          exercise: {
            include: {
              machineType: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
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
 * Obtiene un entrenamiento por su ID.
 */
export async function getWorkoutById(id: string) {
  return prisma.workout.findUnique({
    where: { id },
    include: {
      exercises: {
        include: {
          exercise: {
            include: {
              machineType: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
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
 * Actualiza un entrenamiento existente.
 */
export async function updateWorkout(id: string, data: {
  name?: string;
  description?: string;
}) {
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description || null;

  return prisma.workout.update({
    where: { id },
    data: updateData,
    include: {
      exercises: {
        include: {
          exercise: {
            include: {
              machineType: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
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
 * Elimina un entrenamiento y todos sus ejercicios asociados.
 */
export async function deleteWorkout(id: string) {
  return prisma.workout.delete({
    where: { id },
  });
}

/**
 * Agrega un ejercicio a un entrenamiento en un día específico.
 */
export async function addExerciseToWorkout(workoutId: string, data: {
  exerciseId: string;
  dayOfWeek: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  order: number; // Orden en el día (para arrastrar y soltar)
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number;
  restSeconds?: number;
  notes?: string;
}) {
  // Verificar que el entrenamiento existe
  const workout = await prisma.workout.findUnique({ where: { id: workoutId } });
  if (!workout) {
    throw new Error('Entrenamiento no encontrado');
  }

  // Verificar que el ejercicio existe
  const exercise = await prisma.exercise.findUnique({ where: { id: data.exerciseId } });
  if (!exercise) {
    throw new Error('Ejercicio no encontrado');
  }

  // Validar dayOfWeek (0-6)
  if (data.dayOfWeek < 0 || data.dayOfWeek > 6) {
    throw new Error('dayOfWeek debe estar entre 0 (Domingo) y 6 (Sábado)');
  }

  return prisma.workoutExercise.create({
    data: {
      workoutId,
      exerciseId: data.exerciseId,
      dayOfWeek: data.dayOfWeek,
      order: data.order,
      sets: data.sets || null,
      reps: data.reps || null,
      weight: data.weight || null,
      duration: data.duration || null,
      restSeconds: data.restSeconds || null,
      notes: data.notes || null,
    },
    include: {
      exercise: {
        include: {
          machineType: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Actualiza un ejercicio en un entrenamiento.
 */
export async function updateWorkoutExercise(id: string, data: {
  dayOfWeek?: number;
  order?: number;
  sets?: number | null;
  reps?: number | null;
  weight?: number | null;
  duration?: number | null;
  restSeconds?: number | null;
  notes?: string | null;
}) {
  const updateData: any = {};
  if (data.dayOfWeek !== undefined) {
    if (data.dayOfWeek < 0 || data.dayOfWeek > 6) {
      throw new Error('dayOfWeek debe estar entre 0 (Domingo) y 6 (Sábado)');
    }
    updateData.dayOfWeek = data.dayOfWeek;
  }
  if (data.order !== undefined) updateData.order = data.order;
  if (data.sets !== undefined) updateData.sets = data.sets;
  if (data.reps !== undefined) updateData.reps = data.reps;
  if (data.weight !== undefined) updateData.weight = data.weight;
  if (data.duration !== undefined) updateData.duration = data.duration;
  if (data.restSeconds !== undefined) updateData.restSeconds = data.restSeconds;
  if (data.notes !== undefined) updateData.notes = data.notes;

  return prisma.workoutExercise.update({
    where: { id },
    data: updateData,
    include: {
      exercise: {
        include: {
          machineType: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Elimina un ejercicio de un entrenamiento.
 */
export async function removeExerciseFromWorkout(id: string) {
  return prisma.workoutExercise.delete({
    where: { id },
  });
}

/**
 * Actualiza el orden de múltiples ejercicios (para arrastrar y soltar).
 */
export async function reorderWorkoutExercises(workoutId: string, exercises: Array<{
  id: string;
  dayOfWeek: number;
  order: number;
}>) {
  // Verificar que el entrenamiento existe
  const workout = await prisma.workout.findUnique({ where: { id: workoutId } });
  if (!workout) {
    throw new Error('Entrenamiento no encontrado');
  }

  // Actualizar cada ejercicio
  const updates = exercises.map(ex => 
    prisma.workoutExercise.update({
      where: { id: ex.id },
      data: {
        dayOfWeek: ex.dayOfWeek,
        order: ex.order,
      },
    })
  );

  await Promise.all(updates);

  // Retornar el entrenamiento actualizado
  return getWorkoutById(workoutId);
}

