import type { Request, Response } from 'express';
import {
  createClass, listClasses, getClassById, updateClass, deleteClass,
  listUsersInClass, joinClass, leaveClass, addCenterToClass,
  removeCenterFromClass, updateCenterInClass,
} from './classes.service.js';
import { prisma } from '../../config/db.js';

/**
 * Controlador para crear una nueva clase de gimnasio.
 * Valida los datos del cuerpo de la petición antes de crear la clase.
 * Retorna la clase creada con un status 201.
 */
export async function createClassCtrl(req: Request, res: Response) {
  try {
    const cls = await createClass(req.body);
    res.status(201).json(cls);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ message: 'Nombre de clase ya existe' });
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para listar todas las clases de gimnasio disponibles.
 * Retorna una lista ordenada por fecha de creación descendente.
 * Puede filtrar por centro si se proporciona centerId en query params.
 */
export async function listClassesCtrl(req: Request, res: Response) {
  try {
    const centerId = req.query.centerId as string | undefined;
    const list = await listClasses(centerId || null);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para obtener una clase específica por su ID.
 * Retorna todos los datos de la clase incluyendo fechas de creación y actualización.
 */
export async function getClassCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requerido' });
    const cls = await getClassById(id);
    if (!cls) return res.status(404).json({ message: 'Clase no encontrada' });
    res.json(cls);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para actualizar los datos de una clase existente.
 * Permite modificar el nombre y/o descripción de la clase.
 * Retorna la clase actualizada con sus fechas de modificación.
 */
export async function updateClassCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requerido' });
    const updated = await updateClass(id, req.body);
    res.json(updated);
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Clase no encontrada' });
    if (error.code === 'P2002') return res.status(409).json({ message: 'Nombre de clase ya existe' });
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para eliminar una clase de gimnasio.
 * Desconecta automáticamente a todos los usuarios apuntados antes de eliminar.
 * Retorna un status 204 sin contenido en caso de éxito.
 */
export async function deleteClassCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requerido' });
    await deleteClass(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Clase no encontrada' });
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para listar todos los usuarios apuntados a una clase específica.
 * Retorna información pública de cada usuario ordenados por fecha de creación.
 */
export async function listClassUsersCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requerido' });
    const users = await listUsersInClass(id);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para que un usuario se apunte a una clase de gimnasio.
 * Verifica que la clase exista antes de crear la relación.
 * Utiliza el ID del usuario autenticado desde el token JWT.
 */
export async function joinClassCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const classId = req.params.id;
    if (!classId) return res.status(400).json({ message: 'ID de clase requerido' });

    const exists = await prisma.gymClass.findUnique({ where: { id: classId } });
    if (!exists) return res.status(404).json({ message: 'Clase no encontrada' });

    const user = await joinClass(req.user.sub, classId);
    res.json({ message: 'Apuntado a la clase', user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para que un usuario se desapunte de una clase de gimnasio.
 * Verifica que la clase exista antes de eliminar la relación.
 * Utiliza el ID del usuario autenticado desde el token JWT.
 */
export async function leaveClassCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const classId = req.params.id;
    if (!classId) return res.status(400).json({ message: 'ID de clase requerido' });

    const exists = await prisma.gymClass.findUnique({ where: { id: classId } });
    if (!exists) return res.status(404).json({ message: 'Clase no encontrada' });

    const user = await leaveClass(req.user.sub, classId);
    res.json({ message: 'Te has dado de baja de la clase', user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para agregar un centro a una clase existente.
 * Incluye entrenadores y horarios para ese centro específico.
 */
export async function addCenterToClassCtrl(req: Request, res: Response) {
  try {
    const classId = req.params.id;
    if (!classId) return res.status(400).json({ message: 'ID de clase requerido' });

    const updated = await addCenterToClass(classId, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para eliminar un centro de una clase.
 */
export async function removeCenterFromClassCtrl(req: Request, res: Response) {
  try {
    const classId = req.params.id;
    const centerId = req.params.centerId;
    if (!classId || !centerId) return res.status(400).json({ message: 'ID de clase y centro requeridos' });

    const updated = await removeCenterFromClass(classId, centerId);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para actualizar un centro en una clase (entrenadores y horarios).
 */
export async function updateCenterInClassCtrl(req: Request, res: Response) {
  try {
    const classId = req.params.id;
    const centerId = req.params.centerId;
    if (!classId || !centerId) return res.status(400).json({ message: 'ID de clase y centro requeridos' });

    const updated = await updateCenterInClass(classId, centerId, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
