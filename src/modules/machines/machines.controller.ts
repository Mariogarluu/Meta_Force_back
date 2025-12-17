import type { Request, Response } from 'express';
import {
  // MachineType functions
  createMachineType,
  listMachineTypes,
  getMachineTypeById,
  updateMachineType,
  deleteMachineType,
  // Machine instance functions
  addMachineToCenter,
  updateMachineInCenter,
  removeMachineFromCenter,
  listMachines,
  getMachineById,
  updateMachine,
  deleteMachine,
  listMachinesByCenter,
} from './machines.service.js';

// ========== MACHINE TYPE CONTROLLERS ==========

/**
 * Controlador para crear un nuevo tipo de máquina
 */
export async function createMachineTypeCtrl(req: Request, res: Response) {
  try {
    const machineType = await createMachineType(req.body);
    res.status(201).json(machineType);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Ya existe un tipo de máquina con este nombre y categoría' });
    }
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para listar todos los tipos de máquinas
 */
export async function listMachineTypesCtrl(req: Request, res: Response) {
  try {
    const centerId = req.query.centerId as string | undefined;
    const machineTypes = await listMachineTypes(centerId || null);
    res.json(machineTypes);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para obtener un tipo de máquina por ID
 */
export async function getMachineTypeCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requerido' });
    const machineType = await getMachineTypeById(id);
    if (!machineType) return res.status(404).json({ message: 'Tipo de máquina no encontrado' });
    res.json(machineType);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para actualizar un tipo de máquina
 */
export async function updateMachineTypeCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requerido' });
    const updated = await updateMachineType(id, req.body);
    res.json(updated);
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Tipo de máquina no encontrado' });
    if (error.code === 'P2002') return res.status(409).json({ message: 'Ya existe un tipo con este nombre y categoría' });
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para eliminar un tipo de máquina
 */
export async function deleteMachineTypeCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requerido' });
    await deleteMachineType(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Tipo de máquina no encontrado' });
    res.status(500).json({ message: error.message });
  }
}

// ========== MACHINE INSTANCE CONTROLLERS ==========

/**
 * Controlador para agregar instancias de un tipo de máquina a un centro
 */
export async function addMachineToCenterCtrl(req: Request, res: Response) {
  try {
    const machineTypeId = req.params.id;
    if (!machineTypeId) return res.status(400).json({ message: 'ID de tipo de máquina requerido' });
    const instances = await addMachineToCenter(machineTypeId, req.body);
    res.status(201).json(instances);
  } catch (error: any) {
    if (error.message === 'Tipo de máquina no encontrado' || error.message === 'Centro no encontrado') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para actualizar una instancia de máquina en un centro
 */
export async function updateMachineInCenterCtrl(req: Request, res: Response) {
  try {
    const { id: machineTypeId, centerId, instanceNumber } = req.params;
    if (!machineTypeId || !centerId || !instanceNumber) {
      return res.status(400).json({ message: 'Parámetros requeridos: id (machineTypeId), centerId, instanceNumber' });
    }
    const instanceNum = parseInt(instanceNumber, 10);
    if (isNaN(instanceNum)) {
      return res.status(400).json({ message: 'instanceNumber debe ser un número válido' });
    }
    const updated = await updateMachineInCenter(machineTypeId, centerId, instanceNum, req.body);
    res.json(updated);
  } catch (error: any) {
    if (error.message === 'Instancia de máquina no encontrada') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para eliminar una instancia de máquina de un centro
 */
export async function removeMachineFromCenterCtrl(req: Request, res: Response) {
  try {
    const { id: machineTypeId, centerId, instanceNumber } = req.params;
    if (!machineTypeId || !centerId || !instanceNumber) {
      return res.status(400).json({ message: 'Parámetros requeridos: id (machineTypeId), centerId, instanceNumber' });
    }
    const instanceNum = parseInt(instanceNumber, 10);
    if (isNaN(instanceNum)) {
      return res.status(400).json({ message: 'instanceNumber debe ser un número válido' });
    }
    await removeMachineFromCenter(machineTypeId, centerId, instanceNum);
    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'Instancia de máquina no encontrada') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para listar todas las máquinas (instancias)
 */
export async function listMachinesCtrl(req: Request, res: Response) {
  try {
    const centerId = req.query.centerId as string | undefined;
    const machines = await listMachines(centerId || null);
    res.json(machines);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para obtener una máquina por ID
 */
export async function getMachineCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requerido' });
    const machine = await getMachineById(id);
    if (!machine) return res.status(404).json({ message: 'Máquina no encontrada' });
    res.json(machine);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para actualizar una máquina por ID
 */
export async function updateMachineCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requerido' });
    const updated = await updateMachine(id, req.body);
    res.json(updated);
  } catch (error: any) {
    if (error.message === 'Máquina no encontrada') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para eliminar una máquina por ID
 */
export async function deleteMachineCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requerido' });
    await deleteMachine(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'Máquina no encontrada para eliminar') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para listar máquinas de un centro específico
 */
export async function listMachinesByCenterCtrl(req: Request, res: Response) {
  try {
    const centerId = req.params.centerId;
    if (!centerId) return res.status(400).json({ message: 'ID de centro requerido' });
    const machines = await listMachinesByCenter(centerId);
    res.json(machines);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
