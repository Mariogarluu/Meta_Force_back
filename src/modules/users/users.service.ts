import { prisma } from '../../config/db.js';
import bcrypt from 'bcrypt';
import { env } from '../../config/env.js';
import { Role } from '../../types/role.js';
import { createNotification } from '../notifications/notifications.service.js';

/**
 * Crea un nuevo usuario en el sistema.
 */
/**
 * Creates a new user in the database.
 * @param email - Unique email address
 * @param name - Display name
 * @param passwordHash - Bcrypt hashed password
 * @param role - System role
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

/**
 * Finds a user by their unique email.
 */
export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

/**
 * Finds a user by their unique ID.
 */
export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { 
      id: true, email: true, name: true, role: true, status: true, centerId: true, favoriteCenterId: true, profileImageUrl: true, createdAt: true,
      gender: true, birthDate: true, height: true, currentWeight: true, medicalNotes: true
    }
  });
}

/**
 * Lists users, optionally filtered by center.
 */
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
 * Lista todos los entrenadores activos del sistema.
 * Accesible para todos los usuarios autenticados.
 * Incluye la información del centro favorito y el centro actual (centerId) de cada entrenador.
 * Si se proporciona centerId, filtra por centro favorito.
 */
export async function listTrainers(centerId?: string | null) {
  const where: any = {
    role: 'TRAINER',
    status: 'ACTIVE'
  };

  // Si se proporciona centerId, filtrar por centro favorito
  if (centerId) {
    where.favoriteCenterId = centerId;
  }

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      profileImageUrl: true,
      favoriteCenterId: true,
      centerId: true, // Centro actual donde está físicamente
      favoriteCenter: {
        select: {
          id: true,
          name: true
        }
      },
      center: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: { name: 'asc' }
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
      id: true, email: true, name: true, role: true, status: true, centerId: true, favoriteCenterId: true, profileImageUrl: true, createdAt: true,
      gender: true, birthDate: true, height: true, currentWeight: true, medicalNotes: true
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

/**
 * Deletes a user record by ID.
 */
export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}

/**
 * Updates a user's basic profile information.
 */
export async function updateProfile(userId: string, data: { name?: string; email?: string; profileImageUrl?: string | null; gender?: string; birthDate?: string | Date; height?: number; currentWeight?: number; medicalNotes?: string }) {
  const updateData = { ...data };
  if (updateData.birthDate && typeof updateData.birthDate === 'string') {
    updateData.birthDate = new Date(updateData.birthDate);
  }

  return prisma.user.update({
    where: { id: userId },
    data: updateData as any,
    select: { 
      id: true, email: true, name: true, role: true, status: true, profileImageUrl: true, createdAt: true,
      gender: true, birthDate: true, height: true, currentWeight: true, medicalNotes: true
    }
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
    select: { 
      id: true, email: true, name: true, role: true, status: true, profileImageUrl: true, createdAt: true,
      gender: true, birthDate: true, height: true, currentWeight: true, medicalNotes: true
    }
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
      gender: true, birthDate: true, height: true, currentWeight: true, medicalNotes: true,
      center: { select: { id: true, name: true } },
      favoriteCenter: { select: { id: true, name: true } },
    },
  });
}