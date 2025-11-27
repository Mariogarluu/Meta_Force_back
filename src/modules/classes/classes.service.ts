import { prisma } from '../../config/db.js';

/**
 * Crea una nueva clase de gimnasio en el sistema.
 * Requiere al menos un nombre para la clase, la descripción es opcional.
 */
export async function createClass(data: { name: string; description?: string }) {
  return prisma.gymClass.create({
    data,
    select: { id: true, name: true, description: true, createdAt: true },
  });
}

/**
 * Lista todas las clases de gimnasio disponibles ordenadas por fecha de creación descendente.
 * Retorna información básica de cada clase sin incluir la lista de usuarios apuntados.
 */
export async function listClasses() {
  return prisma.gymClass.findMany({
    select: { id: true, name: true, description: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Obtiene una clase de gimnasio completa por su ID.
 * Incluye todas las propiedades de la clase incluyendo fechas de creación y actualización.
 */
export async function getClassById(id: string) {
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

/**
 * Actualiza los datos de una clase de gimnasio existente.
 * Permite modificar el nombre y/o la descripción de la clase.
 */
export async function updateClass(id: string, data: { name?: string; description?: string }) {
  return prisma.gymClass.update({
    where: { id },
    data,
    select: { id: true, name: true, description: true, createdAt: true, updatedAt: true },
  });
}

/**
 * Elimina una clase de gimnasio de la base de datos.
 * Esta operación desconectará automáticamente a todos los usuarios apuntados a la clase.
 */
export async function deleteClass(id: string) {
  return prisma.gymClass.delete({ where: { id } });
}

/**
 * Lista todos los usuarios que están apuntados a una clase específica.
 * Retorna información pública de cada usuario ordenados por fecha de creación.
 */
export async function listUsersInClass(classId: string) {
  return prisma.user.findMany({
    where: { classes: { some: { id: classId } } },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Apunta un usuario a una clase de gimnasio.
 * Crea una relación many-to-many entre el usuario y la clase.
 */
export async function joinClass(userId: string, classId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { classes: { connect: { id: classId } } },
    select: { id: true, email: true, name: true, role: true },
  });
}

/**
 * Desapunta un usuario de una clase de gimnasio.
 * Elimina la relación entre el usuario y la clase sin afectar a otros usuarios.
 */
export async function leaveClass(userId: string, classId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { classes: { disconnect: { id: classId } } },
    select: { id: true, email: true, name: true, role: true },
  });
}
