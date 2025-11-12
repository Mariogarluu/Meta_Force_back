import type { Request, Response } from 'express';
import {
  createCenter, listCenters, getCenterById, updateCenter, deleteCenter, listUsersInCenter,
} from './centers.service.js';

export async function createCenterCtrl(req: Request, res: Response) {
  try {
    const center = await createCenter(req.body);
    res.status(201).json(center);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ message: 'El nombre de centro ya existe' });
    res.status(500).json({ message: error.message });
  }
}

export async function listCentersCtrl(_req: Request, res: Response) {
  try {
    const centers = await listCenters();
    res.json(centers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getCenterCtrl(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    const center = await getCenterById(id);
    if (!center) return res.status(404).json({ message: 'Centro no encontrado' });
    res.json(center);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function updateCenterCtrl(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
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
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    await deleteCenter(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Centro no encontrado' });
    res.status(500).json({ message: error.message });
  }
}

export async function listCenterUsersCtrl(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    const users = await listUsersInCenter(id);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
