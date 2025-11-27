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

    const id = req.params.id;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, centerId: true, createdAt: true }
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
 * ADMIN_CENTER no puede cambiar roles ni asignar usuarios a otros centros.
 * SUPERADMIN tiene acceso completo para actualizar cualquier campo del usuario.
 */
export async function updateUserCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const id = req.params.id;
    
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { centerId: true, role: true }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (req.user.role === Role.ADMIN_CENTER) {
      if (existingUser.centerId !== req.user.centerId) {
        return res.status(403).json({ message: 'No tienes acceso a este usuario' });
      }
      
      const { role, centerId, ...updateData } = req.body;
      const user = await updateUser(id, updateData);
      return res.json(user);
    }

    const user = await updateUser(id, req.body);
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

    const id = req.params.id;

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { centerId: true }
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

    const user = await updateProfile(req.user.sub, req.body);
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
    const result = await changePassword(req.user.sub, currentPassword, newPassword);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Contraseña actual incorrecta') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}
