import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { hasRole } from '../../middleware/hasRole.js';
import { Role } from '../../types/role.js';
import {
  createMealSchema,
  updateMealSchema,
  mealIdParamSchema,
  importMealsSchema,
} from './meals.schema.js';
import {
  createMealCtrl,
  listMealsCtrl,
  getMealCtrl,
  updateMealCtrl,
  deleteMealCtrl,
  importMealsCtrl,
} from './meals.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Meals
 *     description: Gestión del banco de comidas/recetas
 */

/**
 * @swagger
 * /api/meals:
 *   get:
 *     summary: Lista todas las comidas del banco
 *     tags: [Meals]
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/', auth, listMealsCtrl);

/**
 * @swagger
 * /api/meals:
 *   post:
 *     summary: Crea una nueva comida en el banco
 *     tags: [Meals]
 *     security: [ { bearerAuth: [] } ]
 */
router.post('/', auth, validate(createMealSchema), createMealCtrl);

/**
 * @swagger
 * /api/meals/{id}:
 *   get:
 *     summary: Obtiene una comida por ID
 *     tags: [Meals]
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/:id', auth, validate(mealIdParamSchema), getMealCtrl);

/**
 * @swagger
 * /api/meals/{id}:
 *   patch:
 *     summary: Actualiza una comida
 *     tags: [Meals]
 *     security: [ { bearerAuth: [] } ]
 */
router.patch('/:id', auth, validate(updateMealSchema), updateMealCtrl);

/**
 * @swagger
 * /api/meals/{id}:
 *   delete:
 *     summary: Elimina una comida del banco
 *     tags: [Meals]
 *     security: [ { bearerAuth: [] } ]
 */
router.delete('/:id', auth, validate(mealIdParamSchema), deleteMealCtrl);

/**
 * @swagger
 * /api/meals/import:
 *   post:
 *     summary: Importa múltiples comidas desde JSON (solo administradores)
 *     tags: [Meals]
 *     security: [ { bearerAuth: [] } ]
 */
router.post('/import', auth, hasRole(Role.SUPERADMIN, Role.ADMIN_CENTER), validate(importMealsSchema), importMealsCtrl);

export default router;

