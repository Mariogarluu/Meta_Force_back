import { Router, Request, Response } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { z } from 'zod';
import { prisma } from '../../config/db.js';
import { cuidSchema } from '../../utils/validation.js';

const router = Router();

const listMyClassesSchema = {};

const joinMyClassSchema = {
  body: z.object({
    classId: cuidSchema,
  }),
};

const leaveMyClassSchema = {
  params: z.object({
    id: cuidSchema,
  }),
};

/**
 * @swagger
 * /api/users/me/classes:
 *   get:
 *     summary: Lista las clases del usuario autenticado
 *     tags: [Users, Classes]
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/me/classes', auth, validate(listMyClassesSchema), async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });

    const me = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: {
        id: true,
        email: true,
        role: true,
        classes: { select: { id: true, name: true, description: true, createdAt: true } },
      },
    });

    if (!me) return res.status(404).json({ message: 'Usuario no encontrado' });
    return res.json(me.classes);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
});

/**
 * @swagger
 * /api/users/me/classes:
 *   post:
 *     summary: El usuario autenticado se apunta a una clase
 *     tags: [Users, Classes]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [classId]
 *             properties:
 *               classId:
 *                 type: integer
 */
router.post('/me/classes', auth, validate(joinMyClassSchema), async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });

    const { classId } = req.body as { classId: string };

    const exists = await prisma.gymClass.findUnique({ where: { id: classId } });
    if (!exists) return res.status(404).json({ message: 'Clase no encontrada' });

    await prisma.user.update({
      where: { id: req.user.sub },
      data: { classes: { connect: { id: classId } } },
      select: { id: true },
    });

    return res.json({ message: 'Apuntado a la clase', classId });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
});

/**
 * @swagger
 * /api/users/me/classes/{id}:
 *   delete:
 *     summary: El usuario autenticado se da de baja de una clase
 *     tags: [Users, Classes]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 */
router.delete('/me/classes/:id', auth, validate(leaveMyClassSchema), async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });

    const classId = req.params.id;
    if (!classId) return res.status(400).json({ message: 'ID de clase requerido' });

    const exists = await prisma.gymClass.findUnique({ where: { id: classId } });
    if (!exists) return res.status(404).json({ message: 'Clase no encontrada' });

    await prisma.user.update({
      where: { id: req.user.sub },
      data: { classes: { disconnect: { id: classId } } },
      select: { id: true },
    });

    return res.json({ message: 'Te has dado de baja de la clase', classId });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
});

export default router;
