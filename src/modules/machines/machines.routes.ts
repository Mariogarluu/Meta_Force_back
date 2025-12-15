import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createMachineTypeSchema,
  updateMachineTypeSchema,
  machineTypeIdParamSchema,
  addMachineToCenterSchema,
  updateMachineInCenterSchema,
  removeMachineFromCenterSchema,
  updateMachineSchema,
  machineIdParamSchema,
  centerIdParamSchema,
} from './machines.schema.js';
import {
  // MachineType controllers
  createMachineTypeCtrl,
  listMachineTypesCtrl,
  getMachineTypeCtrl,
  updateMachineTypeCtrl,
  deleteMachineTypeCtrl,
  // Machine instance controllers
  addMachineToCenterCtrl,
  updateMachineInCenterCtrl,
  removeMachineFromCenterCtrl,
  listMachinesCtrl,
  getMachineCtrl,
  updateMachineCtrl,
  deleteMachineCtrl,
  listMachinesByCenterCtrl,
} from './machines.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: MachineTypes
 *     description: Gestión de tipos/modelos de máquinas
 *   - name: Machines
 *     description: Gestión de instancias de máquinas en centros
 */

// ========== MACHINE TYPE ROUTES ==========

/**
 * @swagger
 * /api/machines/types:
 *   get:
 *     summary: Lista todos los tipos de máquinas
 *     tags: [MachineTypes]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: centerId
 *         schema:
 *           type: string
 *         description: Filtrar por centro (opcional)
 *     responses:
 *       200:
 *         description: Lista de tipos de máquinas
 */
router.get('/types', auth, listMachineTypesCtrl);

/**
 * @swagger
 * /api/machines/types:
 *   post:
 *     summary: Crea un nuevo tipo de máquina
 *     tags: [MachineTypes]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [cardio, fuerza, peso libre, funcional, otro]
 *     responses:
 *       201:
 *         description: Tipo de máquina creado
 *       409:
 *         description: Ya existe un tipo con este nombre y categoría
 */
router.post('/types', auth, validate(createMachineTypeSchema), createMachineTypeCtrl);

/**
 * @swagger
 * /api/machines/types/{id}:
 *   get:
 *     summary: Obtiene un tipo de máquina por ID
 *     tags: [MachineTypes]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tipo de máquina encontrado
 *       404:
 *         description: Tipo de máquina no encontrado
 */
router.get('/types/:id', auth, validate(machineTypeIdParamSchema), getMachineTypeCtrl);

/**
 * @swagger
 * /api/machines/types/{id}:
 *   patch:
 *     summary: Actualiza un tipo de máquina
 *     tags: [MachineTypes]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tipo de máquina actualizado
 *       404:
 *         description: Tipo de máquina no encontrado
 */
router.patch('/types/:id', auth, validate(updateMachineTypeSchema), updateMachineTypeCtrl);

/**
 * @swagger
 * /api/machines/types/{id}:
 *   delete:
 *     summary: Elimina un tipo de máquina
 *     tags: [MachineTypes]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Tipo de máquina eliminado
 *       404:
 *         description: Tipo de máquina no encontrado
 */
router.delete('/types/:id', auth, validate(machineTypeIdParamSchema), deleteMachineTypeCtrl);

/**
 * @swagger
 * /api/machines/types/{id}/centers:
 *   post:
 *     summary: Agrega instancias de un tipo de máquina a un centro
 *     tags: [MachineTypes]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tipo de máquina
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - centerId
 *               - quantity
 *             properties:
 *               centerId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               status:
 *                 type: string
 *                 enum: [operativa, en mantenimiento, fuera de servicio]
 *                 default: operativa
 *     responses:
 *       201:
 *         description: Instancias creadas
 *       404:
 *         description: Tipo de máquina o centro no encontrado
 */
router.post('/types/:id/centers', auth, validate(addMachineToCenterSchema), addMachineToCenterCtrl);

/**
 * @swagger
 * /api/machines/types/{id}/centers/{centerId}/instances/{instanceNumber}:
 *   patch:
 *     summary: Actualiza una instancia específica de máquina en un centro
 *     tags: [Machines]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tipo de máquina
 *       - in: path
 *         name: centerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: instanceNumber
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [operativa, en mantenimiento, fuera de servicio]
 *     responses:
 *       200:
 *         description: Instancia actualizada
 *       404:
 *         description: Instancia no encontrada
 */
router.patch(
  '/types/:id/centers/:centerId/instances/:instanceNumber',
  auth,
  validate(updateMachineInCenterSchema),
  updateMachineInCenterCtrl
);

/**
 * @swagger
 * /api/machines/types/{id}/centers/{centerId}/instances/{instanceNumber}:
 *   delete:
 *     summary: Elimina una instancia específica de máquina de un centro
 *     tags: [Machines]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tipo de máquina
 *       - in: path
 *         name: centerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: instanceNumber
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Instancia eliminada
 *       404:
 *         description: Instancia no encontrada
 */
router.delete(
  '/types/:id/centers/:centerId/instances/:instanceNumber',
  auth,
  validate(removeMachineFromCenterSchema),
  removeMachineFromCenterCtrl
);

// ========== MACHINE INSTANCE ROUTES ==========

/**
 * @swagger
 * /api/machines:
 *   get:
 *     summary: Lista todas las máquinas (instancias)
 *     tags: [Machines]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: centerId
 *         schema:
 *           type: string
 *         description: Filtrar por centro (opcional)
 *     responses:
 *       200:
 *         description: Lista de máquinas
 */
router.get('/', auth, listMachinesCtrl);

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
 *         required: true
 *         schema:
 *           type: string
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
 *     summary: Actualiza una máquina por ID
 *     tags: [Machines]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [operativa, en mantenimiento, fuera de servicio]
 *     responses:
 *       200:
 *         description: Máquina actualizada
 *       404:
 *         description: Máquina no encontrada
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
 *         required: true
 *         schema:
 *           type: string
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
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de máquinas del centro
 */
router.get('/center/:centerId', auth, validate(centerIdParamSchema), listMachinesByCenterCtrl);

export default router;
