import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createWorkoutSchema,
  updateWorkoutSchema,
  workoutIdParamSchema,
  listWorkoutsQuerySchema,
  addExerciseToWorkoutSchema,
  updateWorkoutExerciseSchema,
  removeExerciseFromWorkoutSchema,
  reorderWorkoutExercisesSchema,
} from './workouts.schema.js';
import {
  createWorkoutCtrl,
  listWorkoutsCtrl,
  getWorkoutCtrl,
  updateWorkoutCtrl,
  deleteWorkoutCtrl,
  addExerciseToWorkoutCtrl,
  updateWorkoutExerciseCtrl,
  removeExerciseFromWorkoutCtrl,
  reorderWorkoutExercisesCtrl,
  duplicateWorkoutCtrl,
} from './workouts.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Workouts
 *     description: Gestión de entrenamientos de usuarios
 */

/**
 * @swagger
 * /api/workouts:
 *   get:
 *     summary: Lista todos los entrenamientos
 *     tags: [Workouts]
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/', auth, listWorkoutsCtrl);

/**
 * @swagger
 * /api/workouts:
 *   post:
 *     summary: Crea un nuevo entrenamiento para el usuario autenticado
 *     tags: [Workouts]
 *     security: [ { bearerAuth: [] } ]
 */
router.post('/', auth, validate(createWorkoutSchema), createWorkoutCtrl);

/**
 * @swagger
 * /api/workouts/{id}:
 *   get:
 *     summary: Obtiene un entrenamiento por ID
 *     tags: [Workouts]
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/:id', auth, validate(workoutIdParamSchema), getWorkoutCtrl);

/**
 * @swagger
 * /api/workouts/{id}:
 *   patch:
 *     summary: Actualiza un entrenamiento
 *     tags: [Workouts]
 *     security: [ { bearerAuth: [] } ]
 */
router.patch('/:id', auth, validate(updateWorkoutSchema), updateWorkoutCtrl);

/**
 * @swagger
 * /api/workouts/{id}:
 *   delete:
 *     summary: Elimina un entrenamiento
 *     tags: [Workouts]
 *     security: [ { bearerAuth: [] } ]
 */
router.delete('/:id', auth, validate(workoutIdParamSchema), deleteWorkoutCtrl);

/**
 * @swagger
 * /api/workouts/{id}/duplicate:
 *   post:
 *     summary: Duplica un entrenamiento existente para el usuario autenticado
 *     tags: [Workouts]
 *     security: [ { bearerAuth: [] } ]
 */
router.post('/:id/duplicate', auth, validate(workoutIdParamSchema), duplicateWorkoutCtrl);

/**
 * @swagger
 * /api/workouts/{id}/exercises:
 *   post:
 *     summary: Agrega un ejercicio a un entrenamiento en un día específico
 *     tags: [Workouts]
 *     security: [ { bearerAuth: [] } ]
 */
router.post('/:id/exercises', auth, validate(addExerciseToWorkoutSchema), addExerciseToWorkoutCtrl);

/**
 * @swagger
 * /api/workouts/{id}/reorder:
 *   post:
 *     summary: Reordena ejercicios en un entrenamiento (arrastrar y soltar)
 *     tags: [Workouts]
 *     security: [ { bearerAuth: [] } ]
 */
router.post('/:id/reorder', auth, validate(reorderWorkoutExercisesSchema), reorderWorkoutExercisesCtrl);

/**
 * @swagger
 * /api/workouts/exercises/{exerciseId}:
 *   patch:
 *     summary: Actualiza un ejercicio en un entrenamiento
 *     tags: [Workouts]
 *     security: [ { bearerAuth: [] } ]
 */
router.patch('/exercises/:exerciseId', auth, validate(updateWorkoutExerciseSchema), updateWorkoutExerciseCtrl);

/**
 * @swagger
 * /api/workouts/exercises/{exerciseId}:
 *   delete:
 *     summary: Elimina un ejercicio de un entrenamiento
 *     tags: [Workouts]
 *     security: [ { bearerAuth: [] } ]
 */
router.delete('/exercises/:exerciseId', auth, validate(removeExerciseFromWorkoutSchema), removeExerciseFromWorkoutCtrl);

export default router;

