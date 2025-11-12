import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createMachineSchema, updateMachineSchema, machineIdParamSchema } from './machines.schema.js';
import {
  createMachineCtrl, listMachinesCtrl, getMachineCtrl, updateMachineCtrl, deleteMachineCtrl, listMachinesByCenterCtrl,
} from './machines.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Machines
 *     description: Gestión de máquinas de gimnasio
 */

/**
 * @swagger
 * /api/machines:
 *   get:
 *     summary: Lista todas las máquinas
 *     tags: [Machines]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Lista de máquinas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Machine'
 */
router.get('/', auth, listMachinesCtrl);

/**
 * @swagger
 * /api/machines:
 *   post:
 *     summary: Crea una máquina
 *     tags: [Machines]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMachineInput'
 *     responses:
 *       201:
 *         description: Máquina creada
 *       404:
 *         description: Centro no encontrado
 */
router.post('/', auth, validate(createMachineSchema), createMachineCtrl);

/**
 * @swagger
 * /api/machines/{id}:
 *   get:
 *     summary: Obtiene una máquina por ID
 *     tags: [Machines]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la máquina
 *     responses:
 *       200:
 *         description: Máquina encontrada
 *       404:
 *         description: Máquina no encontrada
 */
router.get('/:id', auth, validate(machineIdParamSchema), getMachineCtrl);

/**
 * @swagger
 * /api/machines/{id}:
 *   patch:
 *     summary: Actualiza una máquina
 *     tags: [Machines]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la máquina
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMachineInput'
 *     responses:
 *       200:
 *         description: Máquina actualizada
 *       404:
 *         description: Máquina o centro no encontrado
 */
router.patch('/:id', auth, validate(updateMachineSchema), updateMachineCtrl);

/**
 * @swagger
 * /api/machines/{id}:
 *   delete:
 *     summary: Elimina una máquina por ID
 *     tags: [Machines]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la máquina
 *     responses:
 *       204:
 *         description: Máquina eliminada
 *       404:
 *         description: Máquina no encontrada
 */
router.delete('/:id', auth, validate(machineIdParamSchema), deleteMachineCtrl);

/**
 * @swagger
 * /api/machines/center/{centerId}:
 *   get:
 *     summary: Lista las máquinas de un centro específico
 *     tags: [Machines]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: centerId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del centro
 *     responses:
 *       200:
 *         description: Lista de máquinas del centro
 */
router.get('/center/:centerId', auth, listMachinesByCenterCtrl);

export default router;

