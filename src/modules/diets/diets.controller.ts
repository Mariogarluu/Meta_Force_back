import type { Request, Response } from 'express';
import { prisma } from '../../config/db.js';
import {
  createDiet,
  listDiets,
  getDietById,
  updateDiet,
  deleteDiet,
  addMealToDiet,
  updateDietMeal,
  removeMealFromDiet,
  reorderDietMeals,
} from './diets.service.js';

/**
 * Controlador para crear una nueva dieta.
 * La dieta se crea para el usuario autenticado.
 */
export async function createDietCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const diet = await createDiet(req.user.sub, req.body);
    res.status(201).json(diet);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para listar dietas.
 * Puede filtrar por usuario si se proporciona userId en query params.
 * Los entrenadores pueden ver dietas de otros usuarios.
 */
export async function listDietsCtrl(req: Request, res: Response) {
  try {
    const userId = req.query.userId as string | undefined;
    const diets = await listDiets(userId || null);
    res.json(diets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para obtener una dieta específica por su ID.
 */
export async function getDietCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requerido' });
    const diet = await getDietById(id);
    if (!diet) return res.status(404).json({ message: 'Dieta no encontrada' });
    res.json(diet);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para actualizar una dieta existente.
 * Los usuarios solo pueden actualizar sus propias dietas.
 * Los entrenadores pueden actualizar dietas de usuarios.
 */
export async function updateDietCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requerido' });

    // Verificar que la dieta existe y que el usuario tiene permiso
    const diet = await getDietById(id);
    if (!diet) return res.status(404).json({ message: 'Dieta no encontrada' });

    // Si no es el dueño y no es entrenador/admin, denegar
    const isOwner = diet.userId === req.user.sub;
    const isTrainer = req.user.role === 'TRAINER' || req.user.role === 'ADMIN_CENTER' || req.user.role === 'SUPERADMIN';
    if (!isOwner && !isTrainer) {
      return res.status(403).json({ message: 'No tienes permiso para editar esta dieta' });
    }

    const updated = await updateDiet(id, req.body);
    res.json(updated);
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Dieta no encontrada' });
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para eliminar una dieta.
 */
export async function deleteDietCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requerido' });

    // Verificar que la dieta existe y que el usuario tiene permiso
    const diet = await getDietById(id);
    if (!diet) return res.status(404).json({ message: 'Dieta no encontrada' });

    const isOwner = diet.userId === req.user.sub;
    const isTrainer = req.user.role === 'TRAINER' || req.user.role === 'ADMIN_CENTER' || req.user.role === 'SUPERADMIN';
    if (!isOwner && !isTrainer) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar esta dieta' });
    }

    await deleteDiet(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Dieta no encontrada' });
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para agregar una comida a una dieta.
 */
export async function addMealToDietCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const dietId = req.params.id;
    if (!dietId) return res.status(400).json({ message: 'ID de dieta requerido' });

    // Verificar permisos
    const diet = await getDietById(dietId);
    if (!diet) return res.status(404).json({ message: 'Dieta no encontrada' });

    const isOwner = diet.userId === req.user.sub;
    const isTrainer = req.user.role === 'TRAINER' || req.user.role === 'ADMIN_CENTER' || req.user.role === 'SUPERADMIN';
    if (!isOwner && !isTrainer) {
      return res.status(403).json({ message: 'No tienes permiso para editar esta dieta' });
    }

    const dietMeal = await addMealToDiet(dietId, req.body);
    res.status(201).json(dietMeal);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para actualizar una comida en una dieta.
 */
export async function updateDietMealCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const mealId = req.params.mealId;
    if (!mealId) return res.status(400).json({ message: 'ID de comida requerido' });

    // Verificar que la comida de la dieta existe y obtener la dieta
    const dietMeal = await prisma.dietMeal.findUnique({
      where: { id: mealId },
      include: { diet: true },
    });

    if (!dietMeal) return res.status(404).json({ message: 'Comida no encontrada en la dieta' });

    // Verificar permisos
    const isOwner = dietMeal.diet.userId === req.user.sub;
    const isTrainer = req.user.role === 'TRAINER' || req.user.role === 'ADMIN_CENTER' || req.user.role === 'SUPERADMIN';
    if (!isOwner && !isTrainer) {
      return res.status(403).json({ message: 'No tienes permiso para editar esta dieta' });
    }

    const updated = await updateDietMeal(mealId, req.body);
    res.json(updated);
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Comida no encontrada' });
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para eliminar una comida de una dieta.
 */
export async function removeMealFromDietCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const mealId = req.params.mealId;
    if (!mealId) return res.status(400).json({ message: 'ID de comida requerido' });

    // Verificar que la comida de la dieta existe y obtener la dieta
    const dietMeal = await prisma.dietMeal.findUnique({
      where: { id: mealId },
      include: { diet: true },
    });

    if (!dietMeal) return res.status(404).json({ message: 'Comida no encontrada en la dieta' });

    // Verificar permisos
    const isOwner = dietMeal.diet.userId === req.user.sub;
    const isTrainer = req.user.role === 'TRAINER' || req.user.role === 'ADMIN_CENTER' || req.user.role === 'SUPERADMIN';
    if (!isOwner && !isTrainer) {
      return res.status(403).json({ message: 'No tienes permiso para editar esta dieta' });
    }

    await removeMealFromDiet(mealId);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Comida no encontrada' });
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para reordenar comidas (arrastrar y soltar).
 */
export async function reorderDietMealsCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const dietId = req.params.id;
    if (!dietId) return res.status(400).json({ message: 'ID de dieta requerido' });

    // Verificar permisos
    const diet = await getDietById(dietId);
    if (!diet) return res.status(404).json({ message: 'Dieta no encontrada' });

    const isOwner = diet.userId === req.user.sub;
    const isTrainer = req.user.role === 'TRAINER' || req.user.role === 'ADMIN_CENTER' || req.user.role === 'SUPERADMIN';
    if (!isOwner && !isTrainer) {
      return res.status(403).json({ message: 'No tienes permiso para editar esta dieta' });
    }

    const updated = await reorderDietMeals(dietId, req.body.meals);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

