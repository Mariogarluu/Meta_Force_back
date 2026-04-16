import { prisma } from '../../config/db.js';

/**
 * =============================================================================
 * SERVICIO DE RENDIMIENTO (PERFORMANCE SERVICE)
 * =============================================================================
 * Gestiona la comunicación con la base de datos para todas las métricas
 * de rendimiento del usuario, incluyendo peso corporal y récords de fuerza.
 */

/**
 * Recupera el historial de peso corporal de un usuario específico.
 * @param userId - ID único del usuario
 * @returns Promesa con el listado de registros ordenados por fecha
 */
export const getBodyWeightsByUser = async (userId: string) => {
  return prisma.bodyWeightRecord.findMany({
    where: { userId },
    orderBy: { date: 'asc' },
  });
};

/**
 * Crea un nuevo registro de peso corporal vinculado a un usuario.
 * @param userId - ID único del usuario
 * @param data - Datos del registro (peso, fecha opcional, notas opcionales)
 * @returns Promesa con el registro creado
 */
export const createBodyWeight = async (userId: string, data: { weight: number; date?: string; notes?: string }) => {
  return prisma.bodyWeightRecord.create({
    data: {
      userId,
      weight: data.weight,
      date: data.date ? new Date(data.date) : new Date(),
      notes: data.notes || null,
    },
  });
};

/**
 * Elimina un registro de peso específico.
 * Verifica que el registro pertenezca al usuario solicitante.
 * @param id - ID del registro a eliminar
 * @param userId - ID del usuario solicitante (para validación de propiedad)
 * @returns Promesa con el registro eliminado
 */
export const deleteBodyWeight = async (id: string, userId: string) => {
  const record = await prisma.bodyWeightRecord.findUnique({ where: { id } });
  if (!record || record.userId !== userId) {
    throw new Error('Registro no encontrado o no autorizado');
  }
  return prisma.bodyWeightRecord.delete({ where: { id } });
};

/**
 * Obtiene todos los récords de ejercicio (levantamientos) de un usuario.
 * Incluye la información del ejercicio relacionado (nombre, etc).
 * @param userId - ID único del usuario
 * @returns Promesa con el listado de récords
 */
export const getExerciseRecordsByUser = async (userId: string) => {
  return prisma.exerciseRecord.findMany({
    where: { userId },
    include: { exercise: true },
    orderBy: { date: 'asc' },
  });
};

/**
 * Registra una nueva marca/récord en un ejercicio específico.
 * @param userId - ID único del usuario
 * @param data - Detalles del levantamiento (ejercicio, peso, repeticiones...)
 * @returns Promesa con el récord creado, incluyendo metadatos del ejercicio
 */
export const createExerciseRecord = async (userId: string, data: { exerciseId: string; weight: number; reps: number; date?: string; notes?: string }) => {
  return prisma.exerciseRecord.create({
    data: {
      userId,
      exerciseId: data.exerciseId,
      weight: data.weight,
      reps: data.reps,
      date: data.date ? new Date(data.date) : new Date(),
      notes: data.notes || null,
    },
    include: { exercise: true },
  });
};

export const deleteExerciseRecord = async (id: string, userId: string) => {
  const record = await prisma.exerciseRecord.findUnique({ where: { id } });
  if (!record || record.userId !== userId) {
    throw new Error('Registro no encontrado o no autorizado');
  }
  return prisma.exerciseRecord.delete({ where: { id } });
};
