import type { Request, Response } from 'express';
import {
  createCenter, listCenters, getCenterById, updateCenter, deleteCenter, listUsersInCenter,
} from './centers.service.js';
import { Role } from '../../types/role.js';

/**
 * Controlador para crear un nuevo centro de entrenamiento.
 * Solo accesible para SUPERADMIN según las rutas protegidas.
 * Retorna el centro creado con un status 201.
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
 * Controlador para listar todos los centros de entrenamiento disponibles.
 * Retorna una lista ordenada por fecha de creación descendente.
 * Accesible para todos los usuarios autenticados.
 */
export async function listCentersCtrl(_req: Request, res: Response) {
  try {
    const centers = await listCenters();
    res.json(centers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para obtener un centro específico por su ID.
 * Retorna todos los datos del centro incluyendo información de contacto y ubicación.
 */
export async function getCenterCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const center = await getCenterById(id);
    if (!center) return res.status(404).json({ message: 'Centro no encontrado' });
    res.json(center);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para actualizar los datos de un centro existente.
 * Solo accesible para SUPERADMIN según las rutas protegidas.
 * Permite modificar cualquier campo del centro excepto el ID.
 */
export async function updateCenterCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const updated = await updateCenter(id, req.body);
    res.json(updated);
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Centro no encontrado' });
    if (error.code === 'P2002') return res.status(409).json({ message: 'El nombre de centro ya existe' });
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para eliminar un centro de entrenamiento.
 * Solo accesible para SUPERADMIN según las rutas protegidas.
 * Retorna un status 204 sin contenido en caso de éxito.
 */
export async function deleteCenterCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id;
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
 */
export async function listCenterUsersCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const id = req.params.id;
    
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
