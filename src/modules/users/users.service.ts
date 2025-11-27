import { prisma } from '../../config/db.js';
import bcrypt from 'bcrypt';
import { env } from '../../config/env.js';
import { Role } from '../../types/role.js';

/**
 * Crea un nuevo usuario en el sistema con el email, nombre, hash de contraseña y rol proporcionados.
 * Si no se especifica un rol, se asigna el rol USER por defecto.
 */
export async function createUser(email: string, name: string, passwordHash: string, role?: Role | string) {
  return prisma.user.create({
    data: { 
      email, 
      name, 
      passwordHash,
      role: (role as string) || Role.USER
    },
    select: { id: true, email: true, name: true, role: true, status: true, createdAt: true }
  });
}

/**
 * Busca un usuario en la base de datos por su dirección de email.
 * Retorna el usuario completo incluyendo el hash de contraseña si existe.
 */
export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

/**
 * Busca un usuario en la base de datos por su ID.
 * Retorna información pública del usuario sin incluir el hash de contraseña.
 */
export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, status: true, createdAt: true }
  });
}

/**
 * Lista todos los usuarios del sistema.
 * Si se proporciona un centerId, filtra para mostrar solo los usuarios de ese centro.
 * Los usuarios se ordenan por fecha de creación ascendente.
 */
export async function listUsers(centerId?: string | null) {
  const where = centerId ? { centerId } : {};
  
  return prisma.user.findMany({
    where,
    select: { id: true, email: true, name: true, role: true, status: true, centerId: true, createdAt: true },
    orderBy: { createdAt: 'asc' }
  });
}

/**
 * Actualiza los datos de un usuario existente en la base de datos.
 * Permite actualizar el nombre, email, rol, estado y/o centro del usuario identificado por su ID.
 */
export async function updateUser(id: string, data: { name?: string; email?: string; role?: Role | string; status?: string; centerId?: string | null }) {
  return prisma.user.update({
    where: { id },
    data: {
      ...data,
      role: data.role as string | undefined
    },
    select: { id: true, email: true, name: true, role: true, status: true, centerId: true, createdAt: true }
  });
}

/**
 * Elimina un usuario de la base de datos usando su ID.
 * Esta operación es permanente y eliminará todas las relaciones asociadas según la configuración de Prisma.
 */
export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}

/**
 * Actualiza el perfil de un usuario autenticado.
 * Solo permite modificar el nombre y el email, no permite cambiar el rol ni otros datos sensibles.
 */
export async function updateProfile(userId: string, data: { name?: string; email?: string }) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, name: true, role: true, status: true, createdAt: true }
  });
}

/**
 * Cambia la contraseña de un usuario verificando primero que la contraseña actual sea correcta.
 * Hashea la nueva contraseña antes de almacenarla en la base de datos.
 * Lanza un error si el usuario no existe o si la contraseña actual es incorrecta.
 */
export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isValid) {
    throw new Error('Contraseña actual incorrecta');
  }

  const newHash = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash }
  });

  return { message: 'Contraseña actualizada correctamente' };
}

/**
 * Obtiene la información completa del usuario autenticado incluyendo los datos de su centro asignado.
 * Retorna información pública del usuario y datos básicos del centro si tiene uno asignado.
 */
export async function getMeWithCenter(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
      centerId: true,
      center: { select: { id: true, name: true } },
    },
  });
}
