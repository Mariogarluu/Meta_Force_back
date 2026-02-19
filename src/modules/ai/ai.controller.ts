import type { Request, Response } from 'express';
import { logger } from '../../utils/logger.js';
import { chatWithAi, getUserSessions } from './ai.service.js';
import { z } from 'zod';

const chatSchema = z.object({
    message: z.string().min(1),
    sessionId: z.string().optional()
});

export async function chatCtrl(req: Request, res: Response) {
    try {
        const userId = (req as any).user.sub;
        const { message, sessionId } = chatSchema.parse(req.body);

        const result = await chatWithAi(userId, message, sessionId);

        return res.status(200).json(result);
    } catch (error: any) {
        logger.error('Error en chatCtrl:', error);
        return res.status(500).json({ message: error.message || 'Error en el chat' });
    }
}

export async function getSessionsCtrl(req: Request, res: Response) {
    try {
        const userId = (req as any).user.sub;
        const sessions = await getUserSessions(userId);
        return res.status(200).json(sessions);
    } catch (error: any) {
        return res.status(500).json({ message: 'Error cargando historial' });
    }
}
