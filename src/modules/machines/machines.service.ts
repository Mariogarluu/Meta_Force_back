import { prisma } from '../../config/db.js';

export async function createMachine(data: {
  name: string;
  type: string;
  status: string;
  centerId: number;
}) {
  return prisma.machine.create({ data });
}

export async function listMachines() {
  return prisma.machine.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      center: {
        select: { id: true, name: true, city: true },
      },
    },
  });
}

export async function getMachineById(id: number) {
  return prisma.machine.findUnique({
    where: { id },
    include: {
      center: {
        select: { id: true, name: true, city: true, country: true },
      },
    },
  });
}

export async function updateMachine(id: number, data: Partial<Parameters<typeof createMachine>[0]>) {
  return prisma.machine.update({ where: { id }, data });
}

export async function deleteMachine(id: number) {
  return prisma.machine.delete({ where: { id } });
}

export async function listMachinesByCenter(centerId: number) {
  return prisma.machine.findMany({
    where: { centerId },
    orderBy: { createdAt: 'desc' },
  });
}

