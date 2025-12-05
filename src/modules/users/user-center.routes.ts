import { Router, Request, Response } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { z } from 'zod';
import { prisma } from '../../config/db.js';
import { cuidSchema } from '../../utils/validation.js';

const router = Router();

const setMyCenterSchema = {
  body: z.object({ centerId: cuidSchema }),
};

router.patch('/me/center', auth, validate(setMyCenterSchema), async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });

    const { centerId } = req.body as { centerId: string };

    const exists = await prisma.center.findUnique({ where: { id: centerId } });
    if (!exists) return res.status(404).json({ message: 'Centro no encontrado' });

    const u = await prisma.user.update({
      where: { id: req.user.sub },
      data: { centerId },
      select: { id: true, email: true, name: true, role: true, centerId: true },
    });

    return res.json(u);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
});

export default router;
