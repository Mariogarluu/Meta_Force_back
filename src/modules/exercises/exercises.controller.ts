import type { Request, Response } from 'express';
import {
  createExercise,
  listExercises,
  getExerciseById,
  updateExercise,
  deleteExercise,
  importExercises,
} from './exercises.service.js';

/**
 * Controlador para crear un nuevo ejercicio en el banco.
 */
export async function createExerciseCtrl(req: Request, res: Response) {
  try {
    const exercise = await createExercise(req.body);
    res.status(201).json(exercise);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ message: 'Ejercicio ya existe' });
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para listar todos los ejercicios.
 * Puede filtrar por tipo de máquina si se proporciona machineTypeId en query params.
 */
export async function listExercisesCtrl(req: Request, res: Response) {
  try {
    const machineTypeId = req.query.machineTypeId as string | undefined;
    const exercises = await listExercises(machineTypeId || null);
    res.json(exercises);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para obtener un ejercicio específico por su ID.
 */
export async function getExerciseCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requerido' });
    const exercise = await getExerciseById(id);
    if (!exercise) return res.status(404).json({ message: 'Ejercicio no encontrado' });
    res.json(exercise);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para actualizar un ejercicio existente.
 */
export async function updateExerciseCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requerido' });
    const updated = await updateExercise(id, req.body);
    res.json(updated);
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Ejercicio no encontrado' });
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para eliminar un ejercicio del banco.
 */
export async function deleteExerciseCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requerido' });
    await deleteExercise(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Ejercicio no encontrado' });
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para importar múltiples ejercicios desde JSON.
 */
export async function importExercisesCtrl(req: Request, res: Response) {
  try {
    const { exercises } = req.body;
    
    if (!Array.isArray(exercises)) {
      return res.status(400).json({ message: 'Se requiere un array de ejercicios' });
    }

    if (exercises.length === 0) {
      return res.status(400).json({ message: 'El array de ejercicios no puede estar vacío' });
    }

    const results = await importExercises(exercises);
    res.status(200).json(results);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

