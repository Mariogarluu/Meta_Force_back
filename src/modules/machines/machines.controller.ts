import type { Request, Response } from 'express';
import {
  createMachine, listMachines, getMachineById, updateMachine, deleteMachine, listMachinesByCenter,
} from './machines.service.js';

export async function createMachineCtrl(req: Request, res: Response) {
  try {
    const machine = await createMachine(req.body);
    res.status(201).json(machine);
  } catch (error: any) {
    if (error.code === 'P2003') return res.status(404).json({ message: 'Centro no encontrado' });
    res.status(500).json({ message: error.message });
  }
}

export async function listMachinesCtrl(_req: Request, res: Response) {
  try {
    const machines = await listMachines();
    res.json(machines);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getMachineCtrl(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    const machine = await getMachineById(id);
    if (!machine) return res.status(404).json({ message: 'Máquina no encontrada' });
    res.json(machine);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function updateMachineCtrl(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    const updated = await updateMachine(id, req.body);
    res.json(updated);
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Máquina no encontrada' });
    if (error.code === 'P2003') return res.status(404).json({ message: 'Centro no encontrado' });
    res.status(500).json({ message: error.message });
  }
}

export async function deleteMachineCtrl(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    await deleteMachine(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Máquina no encontrada' });
    res.status(500).json({ message: error.message });
  }
}

export async function listMachinesByCenterCtrl(req: Request, res: Response) {
  try {
    const centerId = Number(req.params.centerId);
    if (isNaN(centerId)) return res.status(400).json({ message: 'ID de centro inválido' });
    const machines = await listMachinesByCenter(centerId);
    res.json(machines);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

