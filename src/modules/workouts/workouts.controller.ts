import type { Request, Response } from 'express';
import { prisma } from '../../config/db.js';
import {
  createWorkout,
  listWorkouts,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
  addExerciseToWorkout,
  updateWorkoutExercise,
  removeExerciseFromWorkout,
  reorderWorkoutExercises,
} from './workouts.service.js';

/**
 * Controlador para crear un nuevo entrenamiento.
 * El entrenamiento se crea para el usuario autenticado.
 */
export async function createWorkoutCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const workout = await createWorkout(req.user.sub, req.body);
    res.status(201).json(workout);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para listar entrenamientos.
 * Puede filtrar por usuario si se proporciona userId en query params.
 * Los entrenadores pueden ver entrenamientos de otros usuarios.
 */
export async function listWorkoutsCtrl(req: Request, res: Response) {
  try {
    const userId = req.query.userId as string | undefined;
    const workouts = await listWorkouts(userId || null);
    res.json(workouts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para obtener un entrenamiento específico por su ID.
 */
export async function getWorkoutCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requerido' });
    const workout = await getWorkoutById(id);
    if (!workout) return res.status(404).json({ message: 'Entrenamiento no encontrado' });
    res.json(workout);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para actualizar un entrenamiento existente.
 * Los usuarios solo pueden actualizar sus propios entrenamientos.
 * Los entrenadores pueden actualizar entrenamientos de usuarios.
 */
export async function updateWorkoutCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requerido' });

    // Verificar que el entrenamiento existe y que el usuario tiene permiso
    const workout = await getWorkoutById(id);
    if (!workout) return res.status(404).json({ message: 'Entrenamiento no encontrado' });

    // Si no es el dueño y no es entrenador/admin, denegar
    const isOwner = workout.userId === req.user.sub;
    const isTrainer = req.user.role === 'TRAINER' || req.user.role === 'ADMIN_CENTER' || req.user.role === 'SUPERADMIN';
    if (!isOwner && !isTrainer) {
      return res.status(403).json({ message: 'No tienes permiso para editar este entrenamiento' });
    }

    const updated = await updateWorkout(id, req.body);
    res.json(updated);
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Entrenamiento no encontrado' });
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para eliminar un entrenamiento.
 */
export async function deleteWorkoutCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requerido' });

    // Verificar que el entrenamiento existe y que el usuario tiene permiso
    const workout = await getWorkoutById(id);
    if (!workout) return res.status(404).json({ message: 'Entrenamiento no encontrado' });

    const isOwner = workout.userId === req.user.sub;
    const isTrainer = req.user.role === 'TRAINER' || req.user.role === 'ADMIN_CENTER' || req.user.role === 'SUPERADMIN';
    if (!isOwner && !isTrainer) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este entrenamiento' });
    }

    await deleteWorkout(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Entrenamiento no encontrado' });
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para duplicar un entrenamiento existente.
 * Crea una copia con el mismo contenido y un nombre con sufijo (1), (2), etc.
 */
export async function duplicateWorkoutCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requerido' });

    const duplicated = await duplicateWorkout(id, req.user.sub);
    res.status(201).json(duplicated);
  } catch (error: any) {
    if (error.code === 'P2025' || error.message === 'Entrenamiento no encontrado') {
      return res.status(404).json({ message: 'Entrenamiento no encontrado' });
    }
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para agregar un ejercicio a un entrenamiento.
 */
export async function addExerciseToWorkoutCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const workoutId = req.params.id;
    if (!workoutId) return res.status(400).json({ message: 'ID de entrenamiento requerido' });

    // Verificar permisos
    const workout = await getWorkoutById(workoutId);
    if (!workout) return res.status(404).json({ message: 'Entrenamiento no encontrado' });

    const isOwner = workout.userId === req.user.sub;
    const isTrainer = req.user.role === 'TRAINER' || req.user.role === 'ADMIN_CENTER' || req.user.role === 'SUPERADMIN';
    if (!isOwner && !isTrainer) {
      return res.status(403).json({ message: 'No tienes permiso para editar este entrenamiento' });
    }

    const workoutExercise = await addExerciseToWorkout(workoutId, req.body);
    res.status(201).json(workoutExercise);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para actualizar un ejercicio en un entrenamiento.
 */
export async function updateWorkoutExerciseCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const exerciseId = req.params.exerciseId;
    if (!exerciseId) return res.status(400).json({ message: 'ID de ejercicio requerido' });

    // Verificar que el ejercicio del entrenamiento existe y obtener el entrenamiento
    const workoutExercise = await prisma.workoutExercise.findUnique({
      where: { id: exerciseId },
      include: { workout: true },
    });

    if (!workoutExercise) return res.status(404).json({ message: 'Ejercicio no encontrado en el entrenamiento' });

    // Verificar permisos
    const isOwner = workoutExercise.workout.userId === req.user.sub;
    const isTrainer = req.user.role === 'TRAINER' || req.user.role === 'ADMIN_CENTER' || req.user.role === 'SUPERADMIN';
    if (!isOwner && !isTrainer) {
      return res.status(403).json({ message: 'No tienes permiso para editar este entrenamiento' });
    }

    const updated = await updateWorkoutExercise(exerciseId, req.body);
    res.json(updated);
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Ejercicio no encontrado' });
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para eliminar un ejercicio de un entrenamiento.
 */
export async function removeExerciseFromWorkoutCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const exerciseId = req.params.exerciseId;
    if (!exerciseId) return res.status(400).json({ message: 'ID de ejercicio requerido' });

    // Verificar que el ejercicio del entrenamiento existe y obtener el entrenamiento
    const workoutExercise = await prisma.workoutExercise.findUnique({
      where: { id: exerciseId },
      include: { workout: true },
    });

    if (!workoutExercise) return res.status(404).json({ message: 'Ejercicio no encontrado en el entrenamiento' });

    // Verificar permisos
    const isOwner = workoutExercise.workout.userId === req.user.sub;
    const isTrainer = req.user.role === 'TRAINER' || req.user.role === 'ADMIN_CENTER' || req.user.role === 'SUPERADMIN';
    if (!isOwner && !isTrainer) {
      return res.status(403).json({ message: 'No tienes permiso para editar este entrenamiento' });
    }

    await removeExerciseFromWorkout(exerciseId);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Ejercicio no encontrado' });
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para reordenar ejercicios (arrastrar y soltar).
 */
export async function reorderWorkoutExercisesCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const workoutId = req.params.id;
    if (!workoutId) return res.status(400).json({ message: 'ID de entrenamiento requerido' });

    // Verificar permisos
    const workout = await getWorkoutById(workoutId);
    if (!workout) return res.status(404).json({ message: 'Entrenamiento no encontrado' });

    const isOwner = workout.userId === req.user.sub;
    const isTrainer = req.user.role === 'TRAINER' || req.user.role === 'ADMIN_CENTER' || req.user.role === 'SUPERADMIN';
    if (!isOwner && !isTrainer) {
      return res.status(403).json({ message: 'No tienes permiso para editar este entrenamiento' });
    }

    const updated = await reorderWorkoutExercises(workoutId, req.body.exercises);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

