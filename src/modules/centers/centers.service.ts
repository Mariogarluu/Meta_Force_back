import { prisma } from '../../config/db.js';

export async function createCenter(data: {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
}) {
  return prisma.center.create({ data });
}

export async function listCenters() {
  return prisma.center.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, city: true, country: true, createdAt: true },
  });
}

export async function getCenterById(id: number) {
  return prisma.center.findUnique({ where: { id } });
}

export async function updateCenter(id: number, data: Partial<Parameters<typeof createCenter>[0]>) {
  return prisma.center.update({ where: { id }, data });
}

export async function deleteCenter(id: number) {
  return prisma.center.delete({ where: { id } });
}

export async function listUsersInCenter(id: number) {
  return prisma.user.findMany({
    where: { centerId: id },
    select: { id: true, email: true, name: true, createdAt: true },
  });
}
