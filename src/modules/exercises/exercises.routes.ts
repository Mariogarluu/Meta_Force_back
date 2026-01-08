import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { hasRole } from '../../middleware/hasRole.js';
import { Role } from '../../types/role.js';
import {
  createExerciseSchema,
  updateExerciseSchema,
  exerciseIdParamSchema,
  listExercisesQuerySchema,
  importExercisesSchema,
} from './exercises.schema.js';
import {
  createExerciseCtrl,
  listExercisesCtrl,
  getExerciseCtrl,
  updateExerciseCtrl,
  deleteExerciseCtrl,
  importExercisesCtrl,
} from './exercises.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Exercises
 *     description: Gestión del banco de ejercicios
 */

/**
 * @swagger
 * /api/exercises:
 *   get:
 *     summary: Lista todos los ejercicios del banco
 *     tags: [Exercises]
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/', auth, listExercisesCtrl);

/**
 * @swagger
 * /api/exercises:
 *   post:
 *     summary: Crea un nuevo ejercicio en el banco
 *     tags: [Exercises]
 *     security: [ { bearerAuth: [] } ]
 */
router.post('/', auth, validate(createExerciseSchema), createExerciseCtrl);

/**
 * @swagger
 * /api/exercises/{id}:
 *   get:
 *     summary: Obtiene un ejercicio por ID
 *     tags: [Exercises]
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/:id', auth, validate(exerciseIdParamSchema), getExerciseCtrl);

/**
 * @swagger
 * /api/exercises/{id}:
 *   patch:
 *     summary: Actualiza un ejercicio
 *     tags: [Exercises]
 *     security: [ { bearerAuth: [] } ]
 */
router.patch('/:id', auth, validate(updateExerciseSchema), updateExerciseCtrl);

/**
 * @swagger
 * /api/exercises/{id}:
 *   delete:
 *     summary: Elimina un ejercicio del banco
 *     tags: [Exercises]
 *     security: [ { bearerAuth: [] } ]
 */
router.delete('/:id', auth, validate(exerciseIdParamSchema), deleteExerciseCtrl);

/**
 * @swagger
 * /api/exercises/import:
 *   post:
 *     summary: Importa múltiples ejercicios desde JSON (solo administradores)
 *     tags: [Exercises]
 *     security: [ { bearerAuth: [] } ]
 */
router.post('/import', auth, hasRole(Role.SUPERADMIN, Role.ADMIN_CENTER), validate(importExercisesSchema), importExercisesCtrl);

export default router;

