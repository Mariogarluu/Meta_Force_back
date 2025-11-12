import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createClassSchema, updateClassSchema, classIdParamSchema } from './classes.schema.js';
import {
  createClassCtrl, listClassesCtrl, getClassCtrl, updateClassCtrl, deleteClassCtrl,
  listClassUsersCtrl, joinClassCtrl, leaveClassCtrl,
} from './classes.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Classes
 *     description: Gestión de clases (gimnasio)
 */

/**
 * @swagger
 * /api/classes:
 *   get:
 *     summary: Lista todas las clases
 *     tags: [Classes]
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/', auth, listClassesCtrl);

/**
 * @swagger
 * /api/classes:
 *   post:
 *     summary: Crea una clase
 *     tags: [Classes]
 *     security: [ { bearerAuth: [] } ]
 */
router.post('/', auth, validate(createClassSchema), createClassCtrl);

/**
 * @swagger
 * /api/classes/{id}:
 *   get:
 *     summary: Obtiene una clase por ID
 *     tags: [Classes]
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/:id', auth, validate(classIdParamSchema), getClassCtrl);

/**
 * @swagger
 * /api/classes/{id}:
 *   patch:
 *     summary: Actualiza una clase
 *     tags: [Classes]
 *     security: [ { bearerAuth: [] } ]
 */
router.patch('/:id', auth, validate(updateClassSchema), updateClassCtrl);

/**
 * @swagger
 * /api/classes/{id}:
 *   delete:
 *     summary: Elimina una clase
 *     tags: [Classes]
 *     security: [ { bearerAuth: [] } ]
 */
router.delete('/:id', auth, validate(classIdParamSchema), deleteClassCtrl);

/**
 * @swagger
 * /api/classes/{id}/users:
 *   get:
 *     summary: Lista los usuarios apuntados a la clase
 *     tags: [Classes]
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/:id/users', auth, validate(classIdParamSchema), listClassUsersCtrl);

/**
 * @swagger
 * /api/classes/{id}/join:
 *   post:
 *     summary: El usuario autenticado se apunta a la clase
 *     tags: [Classes]
 *     security: [ { bearerAuth: [] } ]
 */
router.post('/:id/join', auth, validate(classIdParamSchema), joinClassCtrl);

/**
 * @swagger
 * /api/classes/{id}/join:
 *   delete:
 *     summary: El usuario autenticado se da de baja de la clase
 *     tags: [Classes]
 *     security: [ { bearerAuth: [] } ]
 */
router.delete('/:id/join', auth, validate(classIdParamSchema), leaveClassCtrl);

export default router;
