import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { upload } from '../../middleware/upload.js';
import {
  createTicketSchema,
  ticketIdParamSchema,
  updateTicketSchema
} from './tickets.schema.js';
import {
  createTicketCtrl,
  listTicketsCtrl,
  getTicketCtrl,
  updateTicketCtrl,
  deleteTicketCtrl
} from './tickets.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 * - name: Tickets
 * description: Gestión de tickets de contacto
 */

/**
 * POST /api/tickets
 * Crea un nuevo ticket de contacto (público, sin autenticación)
 * Permite subir archivos adjuntos (imágenes y PDFs)
 */
router.post(
  '/',
  upload.array('attachments', 5), // Máximo 5 archivos
  validate(createTicketSchema),
  createTicketCtrl
);

/**
 * GET /api/tickets
 * Lista todos los tickets (requiere autenticación)
 * - SUPERADMIN: ve todos los tickets
 * - ADMIN_CENTER: solo ve tickets de su centro
 */
router.get('/', auth, listTicketsCtrl);

/**
 * GET /api/tickets/:id
 * Obtiene un ticket por ID (requiere autenticación)
 */
router.get('/:id', auth, validate(ticketIdParamSchema), getTicketCtrl);

/**
 * PATCH /api/tickets/:id
 * Actualiza un ticket (requiere autenticación)
 */
router.patch('/:id', auth, validate(updateTicketSchema), updateTicketCtrl);

/**
 * DELETE /api/tickets/:id
 * Elimina un ticket (requiere autenticación)
 */
router.delete('/:id', auth, validate(ticketIdParamSchema), deleteTicketCtrl);

export default router;