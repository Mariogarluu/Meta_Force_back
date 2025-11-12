import type { Request, Response } from 'express';
import {
  createClass, listClasses, getClassById, updateClass, deleteClass,
  listUsersInClass, joinClass, leaveClass,
} from './classes.service.js';
import { prisma } from '../../config/db.js';

export async function createClassCtrl(req: Request, res: Response) {
  try {
    const cls = await createClass(req.body);
    res.status(201).json(cls);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ message: 'Nombre de clase ya existe' });
    res.status(500).json({ message: error.message });
  }
}

export async function listClassesCtrl(_req: Request, res: Response) {
  try {
    const list = await listClasses();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getClassCtrl(req: Request, res: Response) {
  try {
    const id = Number((req.params as any).id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    const cls = await getClassById(id);
    if (!cls) return res.status(404).json({ message: 'Clase no encontrada' });
    res.json(cls);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function updateClassCtrl(req: Request, res: Response) {
  try {
    const id = Number((req.params as any).id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    const updated = await updateClass(id, req.body);
    res.json(updated);
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Clase no encontrada' });
    if (error.code === 'P2002') return res.status(409).json({ message: 'Nombre de clase ya existe' });
    res.status(500).json({ message: error.message });
  }
}

export async function deleteClassCtrl(req: Request, res: Response) {
  try {
    const id = Number((req.params as any).id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    await deleteClass(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Clase no encontrada' });
    res.status(500).json({ message: error.message });
  }
}

export async function listClassUsersCtrl(req: Request, res: Response) {
  try {
    const id = Number((req.params as any).id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    const users = await listUsersInClass(id);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function joinClassCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const classId = Number((req.params as any).id);
    if (isNaN(classId)) return res.status(400).json({ message: 'ID inválido' });

    const exists = await prisma.gymClass.findUnique({ where: { id: classId } });
    if (!exists) return res.status(404).json({ message: 'Clase no encontrada' });

    const user = await joinClass(req.user.sub, classId);
    res.json({ message: 'Apuntado a la clase', user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function leaveClassCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const classId = Number((req.params as any).id);
    if (isNaN(classId)) return res.status(400).json({ message: 'ID inválido' });

    const exists = await prisma.gymClass.findUnique({ where: { id: classId } });
    if (!exists) return res.status(404).json({ message: 'Clase no encontrada' });

    const user = await leaveClass(req.user.sub, classId);
    res.json({ message: 'Te has dado de baja de la clase', user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
