import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { hasRole } from '../../middleware/hasRole.js';
import { Role } from '../../types/role.js';
import { scanQRSchema } from './access.schema.js';
import { scanQRCtrl } from './access.controller.js';

const router = Router();

/**
 * Rutas del módulo de acceso para registro de entrada/salida mediante códigos QR.
 * 
 * Todas las rutas requieren autenticación JWT y rol SUPERADMIN o ADMIN_CENTER.
 * 
 * Endpoints:
 * - POST /api/access/scan: Escanea un código QR y registra entrada o salida automáticamente
 */

/**
 * @swagger
 * /api/access/scan:
 *   post:
 *     summary: Escanea un código QR y registra entrada o salida
 *     tags: [Access]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qrData
 *               - centerId
 *             properties:
 *               qrData:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *               centerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Operación exitosa (entrada o salida registrada)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 type:
 *                   type: string
 *                   enum: [entry, exit]
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: QR expirado o datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos para este centro
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: Usuario ya registrado en otro centro
 */
router.post('/scan', auth, hasRole(Role.SUPERADMIN, Role.ADMIN_CENTER), validate(scanQRSchema), scanQRCtrl);

export default router;

