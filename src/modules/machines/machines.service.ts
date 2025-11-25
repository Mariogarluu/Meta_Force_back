import { prisma } from '../../config/db.js';

/**
 * Crea una nueva máquina de gimnasio y la asigna a un centro específico.
 * Requiere nombre, tipo, estado y el ID del centro al que pertenece.
 */
export async function createMachine(data: {
  name: string;
  type: string;
  status: string;
  centerId: string;
}) {
  return prisma.machine.create({ data });
}

/**
 * Lista todas las máquinas de todos los centros ordenadas por fecha de creación descendente.
 * Incluye información del centro al que pertenece cada máquina.
 */
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

/**
 * Obtiene una máquina de gimnasio completa por su ID.
 * Incluye toda la información de la máquina y detalles del centro al que pertenece.
 */
export async function getMachineById(id: string) {
  return prisma.machine.findUnique({
    where: { id },
    include: {
      center: {
        select: { id: true, name: true, city: true, country: true },
      },
    },
  });
}

/**
 * Actualiza los datos de una máquina de gimnasio existente.
 * Permite modificar el nombre, tipo, estado y/o el centro al que pertenece.
 */
export async function updateMachine(id: string, data: Partial<Parameters<typeof createMachine>[0]>) {
  return prisma.machine.update({ where: { id }, data });
}

/**
 * Elimina una máquina de gimnasio de la base de datos.
 * Esta operación es permanente y no afecta al centro al que pertenecía.
 */
export async function deleteMachine(id: string) {
  return prisma.machine.delete({ where: { id } });
}

/**
 * Lista todas las máquinas de un centro específico.
 * Retorna las máquinas ordenadas por fecha de creación descendente.
 */
export async function listMachinesByCenter(centerId: string) {
  return prisma.machine.findMany({
    where: { centerId },
    orderBy: { createdAt: 'desc' },
  });
}

