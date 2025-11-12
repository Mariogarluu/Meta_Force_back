import { prisma } from '../../config/db.js';

export async function createClass(data: { name: string; description?: string }) {
  return prisma.gymClass.create({
    data,
    select: { id: true, name: true, description: true, createdAt: true },
  });
}

export async function listClasses() {
  return prisma.gymClass.findMany({
    select: { id: true, name: true, description: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getClassById(id: number) {
  return prisma.gymClass.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateClass(id: number, data: { name?: string; description?: string }) {
  return prisma.gymClass.update({
    where: { id },
    data,
    select: { id: true, name: true, description: true, createdAt: true, updatedAt: true },
  });
}

export async function deleteClass(id: number) {
  return prisma.gymClass.delete({ where: { id } });
}

export async function listUsersInClass(classId: number) {
  return prisma.user.findMany({
    where: { classes: { some: { id: classId } } },
    select: { id: true, email: true, name: true, createdAt: true },
    orderBy: { id: 'asc' },
  });
}

export async function joinClass(userId: number, classId: number) {
  return prisma.user.update({
    where: { id: userId },
    data: { classes: { connect: { id: classId } } },
    select: { id: true, email: true, name: true },
  });
}

export async function leaveClass(userId: number, classId: number) {
  return prisma.user.update({
    where: { id: userId },
    data: { classes: { disconnect: { id: classId } } },
    select: { id: true, email: true, name: true },
  });
}
