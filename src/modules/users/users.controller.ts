import type { Request, Response } from 'express';
import {
  listUsers,
  findUserById,
  updateUser,
  deleteUser,
  updateProfile,
  changePassword,
  getMeWithCenter,
} from './users.service.js';
import { Role } from '../../types/role.js';
import { prisma } from '../../config/db.js';

/**
 * Controlador para listar usuarios del sistema.
 * SUPERADMIN puede ver todos los usuarios, ADMIN_CENTER solo ve usuarios de su centro.
 * Retorna un array con la información pública de cada usuario.
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
 * Controlador para obtener un usuario específico por su ID.
 * Verifica los permisos según el rol del usuario autenticado.
 * ADMIN_CENTER solo puede ver usuarios de su propio centro.
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
      select: { id: true, email: true, name: true, role: true, status: true, centerId: true, favoriteCenterId: true, createdAt: true }
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
