import { prisma } from '../../config/db.js';

/**
 * Crea un nuevo centro de entrenamiento en el sistema con los datos proporcionados.
 * Todos los campos excepto el nombre son opcionales.
 */
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

/**
 * Lista todos los centros de entrenamiento ordenados por fecha de creación descendente.
 * Retorna solo información básica de cada centro.
 */
export async function listCenters() {
  return prisma.center.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, city: true, country: true, createdAt: true },
  });
}

/**
 * Obtiene un centro de entrenamiento completo por su ID.
 * Retorna todos los campos del centro incluyendo información de contacto y ubicación.
 */
export async function getCenterById(id: string) {
  return prisma.center.findUnique({ where: { id } });
}

/**
 * Actualiza los datos de un centro de entrenamiento existente.
 * Permite actualizar cualquier campo del centro excepto el ID.
 */
export async function updateCenter(id: string, data: Partial<Parameters<typeof createCenter>[0]>) {
  return prisma.center.update({ where: { id }, data });
}

/**
 * Elimina un centro de entrenamiento de la base de datos.
 * Esta operación eliminará también todas las máquinas asociadas según la configuración de cascada.
 */
export async function deleteCenter(id: string) {
  return prisma.center.delete({ where: { id } });
}

/**
 * Lista todos los usuarios asignados a un centro específico.
 * Retorna información pública de cada usuario incluyendo su rol y fecha de creación.
 */
export async function listUsersInCenter(id: string) {
  return prisma.user.findMany({
    where: { centerId: id },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
}
