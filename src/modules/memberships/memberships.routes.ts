import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { hasRole } from '../../middleware/hasRole.js';
import { Role } from '../../types/role.js';
import {
  createMembershipPlanSchema,
  updateMembershipPlanSchema,
  membershipPlanIdParamSchema,
} from './memberships.schema.js';
import {
  createMembershipPlanCtrl,
  listMembershipPlansCtrl,
  getMembershipPlanCtrl,
  updateMembershipPlanCtrl,
  deleteMembershipPlanCtrl,
} from './memberships.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Memberships
 *     description: Gestión de planes de membresía
 */

/**
 * @swagger
 * /api/memberships:
 *   get:
 *     summary: Lista todos los planes de membresía
 *     tags: [Memberships]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Lista de planes de membresía
 */
router.get('/', auth, listMembershipPlansCtrl);

/**
 * @swagger
 * /api/memberships:
 *   post:
 *     summary: Crea un plan de membresía
 *     tags: [Memberships]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       201:
 *         description: Plan de membresía creado
 */
router.post(
  '/',
  auth,
  hasRole(Role.SUPERADMIN, Role.ADMIN_CENTER),
  validate(createMembershipPlanSchema),
  createMembershipPlanCtrl
);

/**
 * @swagger
 * /api/memberships/{id}:
 *   get:
 *     summary: Obtiene un plan de membresía por ID
 *     tags: [Memberships]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Plan de membresía encontrado
 *       404:
 *         description: Plan no encontrado
 */
router.get('/:id', auth, validate(membershipPlanIdParamSchema), getMembershipPlanCtrl);

/**
 * @swagger
 * /api/memberships/{id}:
 *   patch:
 *     summary: Actualiza un plan de membresía
 *     tags: [Memberships]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Plan actualizado
 *       404:
 *         description: Plan no encontrado
 */
router.patch(
  '/:id',
  auth,
  hasRole(Role.SUPERADMIN, Role.ADMIN_CENTER),
  validate(updateMembershipPlanSchema),
  updateMembershipPlanCtrl
);

/**
 * @swagger
 * /api/memberships/{id}:
 *   delete:
 *     summary: Elimina un plan de membresía
 *     tags: [Memberships]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       204:
 *         description: Plan eliminado
 *       404:
 *         description: Plan no encontrado
 */
router.delete(
  '/:id',
  auth,
  hasRole(Role.SUPERADMIN, Role.ADMIN_CENTER),
  validate(membershipPlanIdParamSchema),
  deleteMembershipPlanCtrl
);

export default router;

