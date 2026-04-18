import { prisma } from '../../config/db.js';
import bcrypt from 'bcrypt';
import { env } from '../../config/env.js';
import { Role } from '../../types/role.js';
import { createNotification } from '../notifications/notifications.service.js';
import { logger } from '../../utils/logger.js';

/**
 * =============================================================================
 * SERVICIO DE USUARIOS (USERS SERVICE)
 * =============================================================================
 * Este servicio encapsula toda la lógica de persistencia y reglas de negocio
 * relacionadas con la gestión de usuarios, perfiles y permisos.
 */

/**
 * Registra físicamente un nuevo usuario en la persistencia.
 * Se utiliza principalmente durante el flujo de registro (Auth).
 * 
 * @param email - Correo electrónico único del usuario.
 * @param name - Nombre completo o alias.
 * @param passwordHash - Contraseña ya encriptada con Bcrypt.
 * @param role - Rol asignado. Por defecto es 'USER'.
 * @returns Datos del usuario creado (id, email, name, role, status, createdAt).
 */
export async function createUser(
  email: string,
  name: string,
  passwordHash?: string | null,
  role?: Role | string,
) {
  // Realizamos la inserción mediante Prisma Client
  return prisma.user.create({
    data: { 
      email, 
      name, 
      passwordHash: passwordHash ?? null,
      role: (role as Role) || Role.USER
    },
    // Seleccionamos solo campos seguros para devolver al cliente
    select: { id: true, email: true, name: true, role: true, status: true, createdAt: true }
  });
}

/**
 * Localiza a un usuario mediante su dirección de correo electrónico.
 * Utilizado frecuentemente en la validación de login y duplicados.
 * 
 * @param email - Correo a buscar.
 * @returns El objeto de usuario completo si existe, null en caso contrario.
 */
export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

/**
 * Recupera el perfil detallado de un usuario mediante su ID.
 * Incluye datos biométricos, niveles de actividad y objetivos.
 * 
 * @param id - Identificador único de usuario (CUID).
 * @returns Perfil seleccionado o null.
 */
export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { 
      id: true, email: true, name: true, role: true, status: true, centerId: true, favoriteCenterId: true, profileImageUrl: true, createdAt: true,
      gender: true, birthDate: true, height: true, currentWeight: true, medicalNotes: true,
      activityLevel: true, goal: true
    }
  });
}

/**
 * Lista usuarios registrados, con opción de filtrado por centro.
 * Utilizado por administradores para gestión de personal y clientes.
 * 
 * @param centerId - Opcional. ID del centro para filtrar resultados.
 * @returns Array de usuarios con información básica de perfil.
 */
export async function listUsers(centerId?: string | null) {
  // Construcción dinámica de la cláusula WHERE
  const where = centerId ? { centerId } : {};
  return prisma.user.findMany({
    where,
    select: { 
      id: true, email: true, name: true, role: true, status: true, centerId: true, favoriteCenterId: true, profileImageUrl: true, createdAt: true 
    },
    // Ordenamos por antigüedad de registro
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
 * Actualiza los datos de un usuario de forma administrativa.
 * 
 * @param id - ID del usuario a modificar.
 * @param data - Objeto con los campos a actualizar (nombre, email, rol, estado...).
 * @returns El objeto de usuario actualizado.
 * 
 * LÓGICA DE NEGOCIO ADICIONAL:
 * - Si el estado cambia a 'ACTIVE', se dispara una notificación de éxito al usuario
 *   indicando que ya puede acceder a todas las funciones.
 */
export async function updateUser(id: string, data: { name?: string; email?: string; role?: Role | string; status?: string; favoriteCenterId?: string | null; profileImageUrl?: string | null }) {
  const { centerId, ...updateData } = data as any;
  
  // Persistimos los cambios en la BD
  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      ...updateData,
      role: updateData.role as string | undefined
    },
    select: { 
      id: true, email: true, name: true, role: true, status: true, centerId: true, favoriteCenterId: true, profileImageUrl: true, createdAt: true,
      gender: true, birthDate: true, height: true, currentWeight: true, medicalNotes: true,
      activityLevel: true, goal: true
    }
  });

  // SISTEMA DE NOTIFICACIONES: Activación de cuenta
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
      logger.error('Error notificando activación de usuario:', error);
    }
  }

  return updatedUser;
}

/**
 * Elimina físicamente el registro de un usuario de la base de datos.
 * ATENCIÓN: Esta acción es irreversible y borra datos en cascada según el schema.
 * 
 * @param id - ID del usuario a borrar.
 * @returns El objeto de usuario eliminado.
 */
export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}

/**
 * Updates a user's basic profile information.
 */
export async function updateProfile(userId: string, data: { name?: string; email?: string; profileImageUrl?: string | null; gender?: string; birthDate?: string | Date; height?: number; currentWeight?: number; medicalNotes?: string; activityLevel?: string; goal?: string }) {
  const updateData = { ...data };
  if (updateData.birthDate && typeof updateData.birthDate === 'string') {
    updateData.birthDate = new Date(updateData.birthDate);
  }

  return prisma.user.update({
    where: { id: userId },
    data: updateData as any,
    select: { 
      id: true, email: true, name: true, role: true, status: true, profileImageUrl: true, createdAt: true,
      gender: true, birthDate: true, height: true, currentWeight: true, medicalNotes: true,
      activityLevel: true, goal: true
    }
  });
}

/**
 * Actualiza la URL de la imagen de perfil del usuario.
 * @param userId - ID del usuario
 * @param imageUrl - URL pública de la imagen (Supabase Storage)
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

  if (user.passwordHash == null || user.passwordHash === '') {
    throw new Error('Cambia la contraseña desde la app (Supabase) o usa la función auth-change-password.');
  }
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
      activityLevel: true, goal: true,
      center: { select: { id: true, name: true } },
      favoriteCenter: { select: { id: true, name: true } },
    },
  });
}