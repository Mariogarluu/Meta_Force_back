import type { Request, Response } from 'express';
import {
  listUsers,
  listTrainers,
  findUserById,
  updateUser,
  deleteUser,
  updateProfile,
  changePassword,
  getMeWithCenter,
  updateProfileImage,
  deleteProfileImage,
} from './users.service.js';
import { Role } from '../../types/role.js';
import { prisma } from '../../config/db.js';
import { SupabaseStorageService } from '../../services/supabase-storage.service.js';

/**
 * Controlador para listar usuarios del sistema.
 * SUPERADMIN puede ver todos los usuarios, ADMIN_CENTER solo ve usuarios de su centro.
 * Retorna un array con la información pública de cada usuario.
 */
/**
 * Controller to list system users.
 * SUPERADMIN can see all users, ADMIN_CENTER only sees users assigned to their center.
 * Returns an array of user objects with public profile information.
 */
export async function listUsersCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const centerId = req.user.role === Role.SUPERADMIN ? undefined : req.user.centerId || null;
    
    const users = await listUsers(centerId);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para listar entrenadores activos.
 * Accesible para todos los usuarios autenticados.
 * Retorna solo entrenadores con estado ACTIVE.
 * Puede filtrar por centro si se proporciona centerId en query params.
 */
/**
 * Controller to list active trainers.
 * Accessible to all authenticated users. Filters by active status and
 * optionally by center if centerId is provided in query parameters.
 */
export async function listTrainersCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const centerId = req.query.centerId as string | undefined;
    const trainers = await listTrainers(centerId || null);
    res.json(trainers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para obtener un usuario específico por su ID.
 * Verifica los permisos según el rol del usuario autenticado.
 * ADMIN_CENTER solo puede ver usuarios de su propio centro.
 */
/**
 * Controller to retrieve a specific user by ID.
 * Enforces permission checks based on the authenticated user's role.
 */
export async function getUserCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const id = req.params.id as string;
    if (!id) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, status: true, centerId: true, favoriteCenterId: true, profileImageUrl: true, createdAt: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (req.user.role === Role.ADMIN_CENTER) {
      if (user.centerId !== req.user.centerId) {
        return res.status(403).json({ message: 'No tienes acceso a este usuario' });
      }
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para obtener la información del usuario autenticado.
 * Incluye información del centro asignado si tiene uno.
 * Utiliza el ID del usuario desde el token JWT.
 */
/**
 * Controller to get the currently authenticated user's profile.
 * Uses the user ID from the JWT sub claim.
 */
export async function meCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const me = await getMeWithCenter(req.user.sub);
    if (!me) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.json(me);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para actualizar un usuario existente.
 * 
 * IMPORTANTE: El campo centerId (centro actual) NO se puede cambiar desde este endpoint.
 * Solo se puede modificar desde el escáner QR (/api/access/scan). Si se intenta cambiar centerId
 * desde aquí, se ignora silenciosamente.
 * 
 * Permisos:
 * - ADMIN_CENTER: Solo puede actualizar usuarios cuyo favoriteCenterId coincida con su centro.
 *   Puede cambiar favoriteCenterId pero solo a su propio centro. No puede asignar SUPERADMIN.
 * - SUPERADMIN: Acceso completo para actualizar cualquier campo excepto centerId.
 * 
 * Campos actualizables:
 * - name, email, role, status, favoriteCenterId
 * - centerId: IGNORADO (solo se actualiza desde QR scanner)
 * 
 * @param req - Request con el ID del usuario en req.params.id y datos en req.body
 * @param res - Response con el usuario actualizado o error
 */
/**
 * Controller to update an existing user.
 * 
 * IMPORTANT: centerId (physical location) can only be updated via the QR scanner endpoint.
 * Enforces role-based restrictions for ADMIN_CENTER and role assignments.
 */
export async function updateUserCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const id = req.params.id as string;
    if (!id) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { centerId: true, favoriteCenterId: true, role: true }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Eliminar centerId del body si viene - solo se puede cambiar desde el escáner QR
    const { centerId, ...updateData } = req.body;
    
    if (req.user.role === Role.ADMIN_CENTER) {
      // ADMIN_CENTER solo puede gestionar usuarios de su centro favorito
      if (existingUser.favoriteCenterId !== req.user.centerId) {
        return res.status(403).json({ message: 'No tienes acceso a este usuario' });
      }
      
      // Validar que favoriteCenterId sea del centro del admin
      if (updateData.favoriteCenterId && updateData.favoriteCenterId !== req.user.centerId) {
        return res.status(403).json({ message: 'No puedes asignar usuarios a otros centros' });
      }
      
      if (updateData.role === Role.SUPERADMIN) {
        return res.status(403).json({ message: 'No puedes asignar el rol SUPERADMIN' });
      }
    }

    const user = await updateUser(id, updateData);
    res.json(user);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'El email ya está en uso' });
    }
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para eliminar un usuario del sistema.
 * Verifica que el usuario autenticado tenga permisos para eliminar al usuario especificado.
 * ADMIN_CENTER solo puede eliminar usuarios de su propio centro.
 */
/**
 * Controller to delete a user.
 * Enforces permission checks to ensure admins only delete users they have access to.
 */
export async function deleteUserCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const id = req.params.id as string;
    if (!id) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { centerId: true, favoriteCenterId: true }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (req.user.role === Role.ADMIN_CENTER) {
      if (existingUser.centerId !== req.user.centerId) {
        return res.status(403).json({ message: 'No tienes acceso a este usuario' });
      }
    }

    await deleteUser(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para que un usuario actualice su propio perfil.
 * Solo permite modificar nombre y email, no permite cambiar el rol.
 * Utiliza el ID del usuario autenticado desde el token JWT.
 */
/**
 * Controller for users to update their own profile.
 * Restricted to non-sensitive fields like name and email.
 */
export async function updateProfileCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const userId = req.user.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    
    const user = await updateProfile(userId, req.body);
    res.json(user);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'El email ya está en uso' });
    }
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para cambiar la contraseña del usuario autenticado.
 * Verifica que la contraseña actual sea correcta antes de actualizarla.
 * Hashea la nueva contraseña antes de almacenarla en la base de datos.
 */
/**
 * Controller to change the authenticated user's password.
 * Requires verification of the current password.
 */
export async function changePasswordCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    
    const result = await changePassword(userId, currentPassword, newPassword);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Contraseña actual incorrecta') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para subir una imagen de perfil (Supabase Storage, bucket `profiles`).
 * Si el usuario ya tiene una imagen (y no es fauno.png), la elimina del bucket antes de subir la nueva.
 */
export async function uploadProfileImageCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const userId = req.user.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó ninguna imagen' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileImageUrl: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Eliminar imagen anterior si existe y no es fauno.png
    if (user.profileImageUrl && !user.profileImageUrl.includes('fauno.png')) {
      await SupabaseStorageService.deleteFile(user.profileImageUrl, 'profiles');
    }

    // Subir nueva imagen
    const imageUrl = await SupabaseStorageService.uploadProfileImage(req.file.buffer, userId);
    
    // Actualizar en base de datos
    const updatedUser = await updateProfileImage(userId, imageUrl);
    
    res.json(updatedUser);
  } catch (error: any) {
    console.error('Error subiendo imagen de perfil:', error);
    res.status(500).json({ message: error.message || 'Error al subir la imagen' });
  }
}

/**
 * Controlador para eliminar la imagen de perfil del usuario autenticado (Storage + BD).
 */
export async function deleteProfileImageCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const userId = req.user.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileImageUrl: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Eliminar imagen en Storage si existe y no es fauno.png
    if (user.profileImageUrl && !user.profileImageUrl.includes('fauno.png')) {
      await SupabaseStorageService.deleteFile(user.profileImageUrl, 'profiles');
    }

    // Actualizar en base de datos
    const updatedUser = await deleteProfileImage(userId);
    
    res.json(updatedUser);
  } catch (error: any) {
    console.error('Error eliminando imagen de perfil:', error);
    res.status(500).json({ message: error.message || 'Error al eliminar la imagen' });
  }
}
