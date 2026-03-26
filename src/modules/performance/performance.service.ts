import { prisma } from '../../config/db.js';

export const getBodyWeightsByUser = async (userId: string) => {
  return prisma.bodyWeightRecord.findMany({
    where: { userId },
    orderBy: { date: 'asc' },
  });
};

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

export const deleteBodyWeight = async (id: string, userId: string) => {
  const record = await prisma.bodyWeightRecord.findUnique({ where: { id } });
  if (!record || record.userId !== userId) {
    throw new Error('Registro no encontrado o no autorizado');
  }
  return prisma.bodyWeightRecord.delete({ where: { id } });
};

export const getExerciseRecordsByUser = async (userId: string) => {
  return prisma.exerciseRecord.findMany({
    where: { userId },
    include: { exercise: true },
    orderBy: { date: 'asc' },
  });
};

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
