import { prisma } from '../../config/db.js';
import bcrypt from 'bcrypt';
import { env } from '../../config/env.js';
import { Role } from '../../types/role.js';
import { createNotification } from '../notifications/notifications.service.js';

/**
 * Crea un nuevo usuario en el sistema.
 */
export async function createUser(email: string, name: string, passwordHash: string, role?: Role | string) {
  return prisma.user.create({
    data: { 
      email, 
      name, 
      passwordHash,
      role: (role as Role) || Role.USER
    },
    select: { id: true, email: true, name: true, role: true, status: true, createdAt: true }
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { 
      id: true, email: true, name: true, role: true, status: true, centerId: true, favoriteCenterId: true, profileImageUrl: true, createdAt: true 
    }
  });
}

export async function listUsers(centerId?: string | null) {
  const where = centerId ? { centerId } : {};
  return prisma.user.findMany({
    where,
    select: { 
      id: true, email: true, name: true, role: true, status: true, centerId: true, favoriteCenterId: true, profileImageUrl: true, createdAt: true 
    },
    orderBy: { createdAt: 'asc' }
  });
}

/**
 * Actualiza los datos de un usuario.
 * * LÓGICA DE NEGOCIO:
 * Si el estado cambia a 'ACTIVE', notifica al usuario de que su cuenta ha sido activada.
 */
export async function updateUser(id: string, data: { name?: string; email?: string; role?: Role | string; status?: string; favoriteCenterId?: string | null; profileImageUrl?: string | null }) {
  const { centerId, ...updateData } = data as any;
  
  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      ...updateData,
      role: updateData.role as string | undefined
    },
    select: { 
      id: true, email: true, name: true, role: true, status: true, centerId: true, favoriteCenterId: true, profileImageUrl: true, createdAt: true 
    }
  });

  // Notificar activación
  if (data.status === 'ACTIVE') {
    try {
      await createNotification({
        userId: id,
        title: 'Cuenta Activada 🎉',
        message: 'Tu cuenta ha sido validada. Ya puedes acceder a todas las funciones de Meta Force.',
        type: 'SUCCESS',
        link: '/dashboard'
      });
    } catch (error) {
      console.error('Error notificando activación de usuario:', error);
    }
  }

  return updatedUser;
}

export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}

export async function updateProfile(userId: string, data: { name?: string; email?: string; profileImageUrl?: string | null }) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, name: true, role: true, status: true, profileImageUrl: true, createdAt: true }
  });
}

/**
 * Actualiza la URL de la imagen de perfil del usuario.
 * @param userId - ID del usuario
 * @param imageUrl - URL de la imagen en Cloudinary
 */
export async function updateProfileImage(userId: string, imageUrl: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { profileImageUrl: imageUrl },
    select: { id: true, email: true, name: true, role: true, status: true, profileImageUrl: true, createdAt: true }
  });
}

/**
 * Elimina la imagen de perfil del usuario, estableciendo profileImageUrl a null.
 * @param userId - ID del usuario
 */
export async function deleteProfileImage(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { profileImageUrl: null },
    select: { id: true, email: true, name: true, role: true, status: true, profileImageUrl: true, createdAt: true }
  });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Usuario no encontrado');

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) throw new Error('Contraseña actual incorrecta');

  const newHash = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash }
  });
  return { message: 'Contraseña actualizada correctamente' };
}

export async function getMeWithCenter(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true, email: true, name: true, role: true, status: true, profileImageUrl: true, createdAt: true, centerId: true, favoriteCenterId: true,
      center: { select: { id: true, name: true } },
      favoriteCenter: { select: { id: true, name: true } },
    },
  });
}