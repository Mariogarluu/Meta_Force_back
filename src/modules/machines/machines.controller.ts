import type { Request, Response } from 'express';
import {
  createMachine, listMachines, getMachineById, updateMachine, deleteMachine, listMachinesByCenter,
} from './machines.service.js';

/**
 * Controlador para crear una nueva máquina de gimnasio.
 * Valida que el centro especificado exista antes de crear la máquina.
 * Retorna la máquina creada con un status 201.
 */
export async function createMachineCtrl(req: Request, res: Response) {
  try {
    const machine = await createMachine(req.body);
    res.status(201).json(machine);
  } catch (error: any) {
    if (error.code === 'P2003') return res.status(404).json({ message: 'Centro no encontrado' });
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para listar todas las máquinas de todos los centros.
 * Incluye información del centro al que pertenece cada máquina.
 * Retorna las máquinas ordenadas por fecha de creación descendente.
 */
export async function listMachinesCtrl(_req: Request, res: Response) {
  try {
    const machines = await listMachines();
    res.json(machines);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para obtener una máquina específica por su ID.
 * Retorna todos los datos de la máquina incluyendo información detallada del centro.
 */
export async function getMachineCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const machine = await getMachineById(id);
    if (!machine) return res.status(404).json({ message: 'Máquina no encontrada' });
    res.json(machine);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para actualizar los datos de una máquina existente.
 * Permite modificar el nombre, tipo, estado y/o el centro al que pertenece.
 * Valida que el nuevo centro exista si se modifica.
 */
export async function updateMachineCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const updated = await updateMachine(id, req.body);
    res.json(updated);
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Máquina no encontrada' });
    if (error.code === 'P2003') return res.status(404).json({ message: 'Centro no encontrado' });
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para eliminar una máquina de gimnasio.
 * Esta operación es permanente y no afecta al centro al que pertenecía.
 * Retorna un status 204 sin contenido en caso de éxito.
 */
export async function deleteMachineCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id;
    await deleteMachine(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Máquina no encontrada' });
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para listar todas las máquinas de un centro específico.
 * Retorna las máquinas ordenadas por fecha de creación descendente.
 * Útil para mostrar el inventario completo de un centro.
 */
export async function listMachinesByCenterCtrl(req: Request, res: Response) {
  try {
    const centerId = req.params.centerId;
    const machines = await listMachinesByCenter(centerId);
    res.json(machines);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

