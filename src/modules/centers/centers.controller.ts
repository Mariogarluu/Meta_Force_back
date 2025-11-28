import type { Request, Response } from 'express';
import {
  createCenter, listCenters, getCenterById, updateCenter, deleteCenter, listUsersInCenter, getCenterNameByUserId,
} from './centers.service.js';
import { Role } from '../../types/role.js';

/**
 * Controlador para crear un nuevo centro de entrenamiento.
 * Solo SUPERADMIN puede crear centros (protegido por middleware hasRole).
 * Valida que el nombre del centro sea único.
 * 
 * @param req - Request con los datos del centro en el body
 * @param res - Response con el centro creado o error
 */
export async function createCenterCtrl(req: Request, res: Response) {
  try {
    const center = await createCenter(req.body);
    res.status(201).json(center);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ message: 'El nombre de centro ya existe' });
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para listar centros según los permisos del usuario autenticado.
 * - USER, TRAINER, CLEANER: Solo ven el nombre de su centro asignado (sin ID)
 * - ADMIN_CENTER: Ve solo su propio centro con todos los datos
 * - SUPERADMIN: Ve todos los centros del sistema
 * 
 * @param req - Request con el usuario autenticado en req.user
 * @param res - Response con la lista de centros filtrada según permisos
 */
export async function listCentersCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const { role, centerId } = req.user;
    
    if (role === Role.USER || role === Role.TRAINER || role === Role.CLEANER) {
      if (!centerId) {
        return res.json([]);
      }
      const centerName = await getCenterNameByUserId(centerId);
      return res.json(centerName ? [centerName] : []);
    }

    const filterId = role === Role.SUPERADMIN ? null : centerId;
    const centers = await listCenters(filterId, true);
    res.json(centers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para obtener un centro específico por su ID.
 * USER, TRAINER y CLEANER no tienen permiso para ver detalles de centros.
 * ADMIN_CENTER solo puede ver su propio centro.
 * SUPERADMIN puede ver cualquier centro.
 * 
 * @param req - Request con el ID del centro en req.params.id
 * @param res - Response con el centro o error 403/404
 */
export async function getCenterCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const { role } = req.user;
    
    if (role === Role.USER || role === Role.TRAINER || role === Role.CLEANER) {
      return res.status(403).json({ message: 'No tienes permiso para ver este centro' });
    }

    const id = req.params.id as string;
    
    if (role === Role.ADMIN_CENTER) {
      if (req.user.centerId !== id) {
         return res.status(403).json({ message: 'No tienes permiso para ver este centro' });
      }
    }
    
    const center = await getCenterById(id);
    if (!center) return res.status(404).json({ message: 'Centro no encontrado' });
    res.json(center);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para actualizar un centro existente.
 * ADMIN_CENTER solo puede actualizar su propio centro.
 * SUPERADMIN puede actualizar cualquier centro.
 * Valida que el nombre del centro sea único si se modifica.
 * 
 * @param req - Request con el ID del centro en req.params.id y datos en req.body
 * @param res - Response con el centro actualizado o error
 */
export async function updateCenterCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    if (req.user?.role === Role.ADMIN_CENTER) {
      if (req.user.centerId !== id) {
        return res.status(403).json({ message: 'No tienes permiso para editar este centro' });
      }
    }

    const updated = await updateCenter(id, req.body);
    res.json(updated);
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Centro no encontrado' });
    if (error.code === 'P2002') return res.status(409).json({ message: 'El nombre de centro ya existe' });
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para eliminar un centro del sistema.
 * Solo SUPERADMIN puede eliminar centros (protegido por middleware hasRole).
 * Esta operación eliminará también todas las máquinas asociadas.
 * 
 * @param req - Request con el ID del centro en req.params.id
 * @param res - Response con status 204 si se eliminó correctamente
 */
export async function deleteCenterCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    
    await deleteCenter(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Centro no encontrado' });
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para listar los usuarios asignados a un centro específico.
 * ADMIN_CENTER solo puede ver usuarios de su propio centro.
 * SUPERADMIN puede ver usuarios de cualquier centro.
 * 
 * @param req - Request con el ID del centro en req.params.id
 * @param res - Response con la lista de usuarios del centro
 */
export async function listCenterUsersCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const id = req.params.id as string;
    
    if (req.user.role === Role.ADMIN_CENTER) {
      if (id !== req.user.centerId) {
        return res.status(403).json({ message: 'No tienes acceso a este centro' });
      }
    }

    const users = await listUsersInCenter(id);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}