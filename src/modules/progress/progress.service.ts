import { prisma } from '../../config/db.js';

/**
 * Registra una nueva medida física del usuario.
 */
export async function logMeasurement(userId: string, data: { weight?: number, bodyFat?: number, bmi?: number }) {
  return prisma.userMeasurement.create({
    data: {
      userId,
      weight: data.weight ?? null,
      bodyFat: data.bodyFat ?? null,
      bmi: data.bmi ?? null
    }
  });
}

/**
 * Obtiene el historial de medidas de un usuario.
 */
export async function getMeasurementHistory(userId: string) {
  return prisma.userMeasurement.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 50
  });
}

/**
 * Registra el rendimiento en un ejercicio.
 */
export async function logExercisePerformance(userId: string, data: { exerciseId: string, weight?: number, reps?: number, sets?: number, notes?: string }) {
  return prisma.exerciseLog.create({
    data: {
      userId,
      exerciseId: data.exerciseId,
      weight: data.weight ?? null,
      reps: data.reps ?? null,
      sets: data.sets ?? null,
      notes: data.notes ?? null
    }
  });
}

/**
 * Obtiene el historial de rendimiento de un ejercicio específico para un usuario.
 */
export async function getExerciseHistory(userId: string, exerciseId: string) {
  return prisma.exerciseLog.findMany({
    where: { userId, exerciseId },
    orderBy: { date: 'desc' },
    take: 20
  });
}
