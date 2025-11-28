import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createCenterSchema, updateCenterSchema, centerIdParamSchema } from './centers.schema.js';
import { hasRole } from '../../middleware/hasRole.js';
import { Role } from '../../types/role.js';
import {
  createCenterCtrl, listCentersCtrl, getCenterCtrl, updateCenterCtrl, deleteCenterCtrl, listCenterUsersCtrl,
} from './centers.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Centers
 *   description: Gestión de centros (gimnasios)
 */

/**
 * @swagger
 * /api/centers:
 *   get:
 *     summary: Lista todos los centros
 *     tags: [Centers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de centros
 */
router.get('/', auth, listCentersCtrl);

/**
 * @swagger
 * /api/centers:
 *   post:
 *     summary: Crea un centro
 *     tags: [Centers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCenterInput'
 *     responses:
 *       201:
 *         description: Creado
 *       409:
 *         description: Nombre ya existe
 */
router.post('/', auth, hasRole(Role.SUPERADMIN), validate(createCenterSchema), createCenterCtrl);

/**
 * @swagger
 * /api/centers/{id}:
 *   get:
 *     summary: Obtiene un centro por ID
 *     tags: [Centers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: No encontrado
 */
router.get('/:id', auth, validate(centerIdParamSchema), getCenterCtrl);

/**
 * @swagger
 * /api/centers/{id}:
 *   patch:
 *     summary: Actualiza un centro
 *     tags: [Centers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCenterInput'
 *     responses:
 *       200:
 *         description: Actualizado
 *       404:
 *         description: No encontrado
 *       409:
 *         description: Nombre ya existe
 */
router.patch('/:id', auth, hasRole(Role.SUPERADMIN, Role.ADMIN_CENTER), validate(updateCenterSchema), updateCenterCtrl);

/**
 * @swagger
 * /api/centers/{id}:
 *   delete:
 *     summary: Elimina un centro por ID
 *     tags: [Centers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       204:
 *         description: Eliminado
 *       404:
 *         description: No encontrado
 */
router.delete('/:id', auth, hasRole(Role.SUPERADMIN), validate(centerIdParamSchema), deleteCenterCtrl);

/**
 * @swagger
 * /api/centers/{id}/users:
 *   get:
 *     summary: Lista los usuarios asignados a un centro
 *     tags: [Centers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/:id/users', auth, hasRole(Role.SUPERADMIN, Role.ADMIN_CENTER), validate(centerIdParamSchema), listCenterUsersCtrl);

export default router;