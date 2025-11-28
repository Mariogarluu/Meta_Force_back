import { prisma } from '../../config/db.js';
import bcrypt from 'bcrypt';
import { env } from '../../config/env.js';
import { Role } from '../../types/role.js';

/**
 * Crea un nuevo usuario en el sistema con el email, nombre, hash de contraseña y rol proporcionados.
 * El usuario se crea con estado PENDING por defecto y requiere activación por un administrador.
 * Si no se especifica un rol, se asigna el rol USER por defecto.
 * 
 * @param email - Email único del usuario
 * @param name - Nombre completo del usuario
 * @param passwordHash - Hash de la contraseña (debe estar hasheada con bcrypt)
 * @param role - Rol opcional del usuario (por defecto USER)
 * @returns Usuario creado sin incluir el hash de contraseña
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
 * Este método se usa principalmente para autenticación.
 * 
 * @param email - Email del usuario a buscar
 * @returns Usuario encontrado o null si no existe
 */
export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

/**
 * Busca un usuario en la base de datos por su ID.
 * Retorna información pública del usuario sin incluir el hash de contraseña.
 * 
 * @param id - ID único del usuario (CUID)
 * @returns Usuario encontrado o null si no existe
 */
export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { 
      id: true, 
      email: true, 
      name: true, 
      role: true, 
      status: true, 
      centerId: true,
      favoriteCenterId: true,
      createdAt: true 
    }
  });
}

/**
 * Lista todos los usuarios del sistema con filtrado opcional por centro actual.
 * 
 * Si se proporciona un centerId, filtra para mostrar solo los usuarios que están
 * físicamente en ese centro (centerId coincide). Esto es útil para ver quién está
 * actualmente presente en un centro específico.
 * 
 * Los usuarios se ordenan por fecha de creación ascendente.
 * Retorna tanto centerId (centro actual) como favoriteCenterId (centro asignado).
 * 
 * @param centerId - ID del centro actual para filtrar usuarios (opcional)
 * @returns Lista de usuarios con información pública incluyendo centerId y favoriteCenterId
 */
export async function listUsers(centerId?: string | null) {
  const where = centerId ? { centerId } : {};
  
  return prisma.user.findMany({
    where,
    select: { 
      id: true, 
      email: true, 
      name: true, 
      role: true, 
      status: true, 
      centerId: true, 
      favoriteCenterId: true,
      createdAt: true 
    },
    orderBy: { createdAt: 'asc' }
  });
}

/**
 * Actualiza los datos de un usuario existente en la base de datos.
 * 
 * IMPORTANTE: Este método NO permite actualizar centerId (centro actual).
 * El centerId solo se puede modificar desde el módulo de acceso (QR scanner).
 * Si se intenta actualizar centerId, se ignora silenciosamente.
 * 
 * Permite actualizar:
 * - name: Nombre del usuario
 * - email: Email del usuario (debe ser único)
 * - role: Rol del usuario
 * - status: Estado del usuario (PENDING, ACTIVE, INACTIVE)
 * - favoriteCenterId: Centro favorito/asignado del usuario (puede ser null)
 * 
 * No valida permisos - esto debe hacerse en el controlador antes de llamar a este método.
 * 
 * @param id - ID único del usuario a actualizar
 * @param data - Objeto con los campos a actualizar (todos opcionales)
 * @returns Usuario actualizado sin incluir el hash de contraseña, incluyendo centerId y favoriteCenterId
 */
export async function updateUser(id: string, data: { name?: string; email?: string; role?: Role | string; status?: string; favoriteCenterId?: string | null }) {
  // Separar centerId si viene (no debería, pero por seguridad lo ignoramos)
  const { centerId, ...updateData } = data as any;
  
  return prisma.user.update({
    where: { id },
    data: {
      ...updateData,
      role: updateData.role as string | undefined
    },
    select: { 
      id: true, 
      email: true, 
      name: true, 
      role: true, 
      status: true, 
      centerId: true, 
      favoriteCenterId: true,
      createdAt: true 
    }
  });
}

/**
 * Elimina un usuario de la base de datos usando su ID.
 * Esta operación es permanente y eliminará todas las relaciones asociadas según la configuración de Prisma.
 * Las relaciones con centros se eliminan en cascada (onDelete: SetNull).
 * 
 * @param id - ID único del usuario a eliminar
 * @returns Usuario eliminado
 */
export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}

/**
 * Actualiza el perfil de un usuario autenticado.
 * Solo permite modificar el nombre y el email, no permite cambiar el rol ni otros datos sensibles.
 * Este método está diseñado para que los usuarios actualicen su propia información.
 * 
 * @param userId - ID del usuario autenticado
 * @param data - Objeto con nombre y/o email a actualizar
 * @returns Usuario actualizado sin incluir el hash de contraseña
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
 * Hashea la nueva contraseña con bcrypt antes de almacenarla en la base de datos.
 * 
 * @param userId - ID del usuario que quiere cambiar su contraseña
 * @param currentPassword - Contraseña actual en texto plano
 * @param newPassword - Nueva contraseña en texto plano (será hasheada)
 * @returns Objeto con mensaje de éxito
 * @throws Error si el usuario no existe o si la contraseña actual es incorrecta
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
 * Obtiene la información completa del usuario autenticado incluyendo los datos de sus centros.
 * 
 * Retorna información pública del usuario y datos básicos de:
 * - center: Centro actual donde está físicamente (centerId)
 * - favoriteCenter: Centro favorito/asignado (favoriteCenterId)
 * 
 * Este método se usa principalmente para el endpoint /me que devuelve el perfil del usuario autenticado.
 * 
 * @param id - ID único del usuario autenticado
 * @returns Usuario con información de ambos centros (actual y favorito) o null si no existe
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
      favoriteCenterId: true,
      center: { select: { id: true, name: true } },
      favoriteCenter: { select: { id: true, name: true } },
    },
  });
}
