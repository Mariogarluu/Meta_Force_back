import type { Request, Response } from 'express';
import {
  createCenter, listCenters, getCenterById, updateCenter, deleteCenter, listUsersInCenter, getCenterNameByUserId,
} from './centers.service.js';
import { Role } from '../../types/role.js';

export async function createCenterCtrl(req: Request, res: Response) {
  try {
    const center = await createCenter(req.body);
    res.status(201).json(center);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ message: 'El nombre de centro ya existe' });
    res.status(500).json({ message: error.message });
  }
}

export async function listCentersCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const { role, centerId } = req.user;
    
    // 1. USER, TRAINER, CLEANER: Solo ven el nombre de su centro (sin ID)
    if (role === Role.USER || role === Role.TRAINER || role === Role.CLEANER) {
      if (!centerId) {
        return res.json([]);
      }
      const centerName = await getCenterNameByUserId(centerId);
      return res.json(centerName ? [centerName] : []);
    }

    // 2. ADMIN_CENTER y SUPERADMIN
    // LOGICA CAMBIADA: Si es SuperAdmin, filterId es null (trae todos). 
    // Si es AdminCenter, filterId es su centerId (trae solo el suyo).
    const filterId = role === Role.SUPERADMIN ? null : centerId;

    const centers = await listCenters(filterId, true);
    res.json(centers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

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
    
    // Seguridad adicional: Si es Admin de centro, verificar que pide SU centro
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

export async function updateCenterCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    // SEGURIDAD: Verificar propiedad si es ADMIN_CENTER
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