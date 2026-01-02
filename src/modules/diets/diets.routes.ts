import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createDietSchema,
  updateDietSchema,
  dietIdParamSchema,
  listDietsQuerySchema,
  addMealToDietSchema,
  updateDietMealSchema,
  removeMealFromDietSchema,
  reorderDietMealsSchema,
} from './diets.schema.js';
import {
  createDietCtrl,
  listDietsCtrl,
  getDietCtrl,
  updateDietCtrl,
  deleteDietCtrl,
  addMealToDietCtrl,
  updateDietMealCtrl,
  removeMealFromDietCtrl,
  reorderDietMealsCtrl,
} from './diets.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Diets
 *     description: Gestión de dietas de usuarios
 */

/**
 * @swagger
 * /api/diets:
 *   get:
 *     summary: Lista todas las dietas
 *     tags: [Diets]
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/', auth, validate(listDietsQuerySchema), listDietsCtrl);

/**
 * @swagger
 * /api/diets:
 *   post:
 *     summary: Crea una nueva dieta para el usuario autenticado
 *     tags: [Diets]
 *     security: [ { bearerAuth: [] } ]
 */
router.post('/', auth, validate(createDietSchema), createDietCtrl);

/**
 * @swagger
 * /api/diets/{id}:
 *   get:
 *     summary: Obtiene una dieta por ID
 *     tags: [Diets]
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/:id', auth, validate(dietIdParamSchema), getDietCtrl);

/**
 * @swagger
 * /api/diets/{id}:
 *   patch:
 *     summary: Actualiza una dieta
 *     tags: [Diets]
 *     security: [ { bearerAuth: [] } ]
 */
router.patch('/:id', auth, validate(updateDietSchema), updateDietCtrl);

/**
 * @swagger
 * /api/diets/{id}:
 *   delete:
 *     summary: Elimina una dieta
 *     tags: [Diets]
 *     security: [ { bearerAuth: [] } ]
 */
router.delete('/:id', auth, validate(dietIdParamSchema), deleteDietCtrl);

/**
 * @swagger
 * /api/diets/{id}/meals:
 *   post:
 *     summary: Agrega una comida a una dieta en un día y tipo de comida específicos
 *     tags: [Diets]
 *     security: [ { bearerAuth: [] } ]
 */
router.post('/:id/meals', auth, validate(addMealToDietSchema), addMealToDietCtrl);

/**
 * @swagger
 * /api/diets/{id}/reorder:
 *   post:
 *     summary: Reordena comidas en una dieta (arrastrar y soltar)
 *     tags: [Diets]
 *     security: [ { bearerAuth: [] } ]
 */
router.post('/:id/reorder', auth, validate(reorderDietMealsSchema), reorderDietMealsCtrl);

/**
 * @swagger
 * /api/diets/meals/{mealId}:
 *   patch:
 *     summary: Actualiza una comida en una dieta
 *     tags: [Diets]
 *     security: [ { bearerAuth: [] } ]
 */
router.patch('/meals/:mealId', auth, validate(updateDietMealSchema), updateDietMealCtrl);

/**
 * @swagger
 * /api/diets/meals/{mealId}:
 *   delete:
 *     summary: Elimina una comida de una dieta
 *     tags: [Diets]
 *     security: [ { bearerAuth: [] } ]
 */
router.delete('/meals/:mealId', auth, validate(removeMealFromDietSchema), removeMealFromDietCtrl);

export default router;

