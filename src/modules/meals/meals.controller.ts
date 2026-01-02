import type { Request, Response } from 'express';
import {
  createMeal,
  listMeals,
  getMealById,
  updateMeal,
  deleteMeal,
  importMeals,
} from './meals.service.js';

/**
 * Controlador para crear una nueva comida en el banco.
 */
export async function createMealCtrl(req: Request, res: Response) {
  try {
    const meal = await createMeal(req.body);
    res.status(201).json(meal);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ message: 'Comida ya existe' });
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para listar todas las comidas.
 */
export async function listMealsCtrl(req: Request, res: Response) {
  try {
    const meals = await listMeals();
    res.json(meals);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para obtener una comida específica por su ID.
 */
export async function getMealCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requerido' });
    const meal = await getMealById(id);
    if (!meal) return res.status(404).json({ message: 'Comida no encontrada' });
    res.json(meal);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para actualizar una comida existente.
 */
export async function updateMealCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requerido' });
    const updated = await updateMeal(id, req.body);
    res.json(updated);
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Comida no encontrada' });
    if (error.code === 'P2002') return res.status(409).json({ message: 'Nombre de comida ya existe' });
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para eliminar una comida del banco.
 */
export async function deleteMealCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'ID requerido' });
    await deleteMeal(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Comida no encontrada' });
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para importar múltiples comidas desde JSON.
 */
export async function importMealsCtrl(req: Request, res: Response) {
  try {
    const { meals } = req.body;
    
    if (!Array.isArray(meals)) {
      return res.status(400).json({ message: 'Se requiere un array de comidas' });
    }

    if (meals.length === 0) {
      return res.status(400).json({ message: 'El array de comidas no puede estar vacío' });
    }

    const results = await importMeals(meals);
    res.status(200).json(results);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

