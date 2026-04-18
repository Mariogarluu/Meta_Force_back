import type { Request, Response } from 'express';
import { logger } from '../../utils/logger.js';
import { chatWithAi, getUserSessions } from './ai.service.js';
import { z } from 'zod';
import {
  forwardAiChat,
  forwardAiSavePlan,
  forwardAiSessionsDelete,
  forwardAiSessionsGet,
} from './edge-proxy.js';

const chatSchema = z.object({
    message: z.string().min(1),
    sessionId: z.string().optional()
});

export async function chatCtrl(req: Request, res: Response) {
    try {
        const parsed = chatSchema.parse(req.body);
        const forwarded = await forwardAiChat(req, res, parsed);
        if (forwarded) return;

        const userId = (req as any).user.sub;
        const { message, sessionId } = parsed;

        const result = await chatWithAi(userId, message, sessionId);

        return res.status(200).json(result);
    } catch (error: any) {
        logger.error('Error en chatCtrl:', error);
        return res.status(500).json({ message: error.message || 'Error en el chat' });
    }
}

export async function getSessionsCtrl(req: Request, res: Response) {
    try {
        const forwarded = await forwardAiSessionsGet(req, res);
        if (forwarded) return;

        const userId = (req as any).user.sub;
        const sessions = await getUserSessions(userId);
        return res.status(200).json(sessions);
    } catch (error: any) {
        return res.status(500).json({ message: 'Error cargando historial' });
    }
}

export async function savePlanCtrl(req: Request, res: Response) {
    try {
        const { plan } = req.body;

        if (!plan || !plan.type || !plan.name || !plan.days) {
            return res.status(400).json({ message: 'Estructura de plan inválida' });
        }

        const forwarded = await forwardAiSavePlan(req, res, { plan });
        if (forwarded) return;

        const userId = (req as any).user.sub;
        const savedResult = await import('./ai.service.js').then(m => m.saveAiPlan(userId, plan));
        return res.status(201).json(savedResult);
    } catch (error: any) {
        logger.error('Error en savePlanCtrl:', error);
        return res.status(500).json({ message: error.message || 'Error guardando plan' });
    }
}

export async function deleteSessionCtrl(req: Request, res: Response) {
    try {
        const { sessionId } = req.params;

        if (!sessionId) {
            return res.status(400).json({ message: 'Se requiere el ID de la sesión' });
        }

        const forwarded = await forwardAiSessionsDelete(req, res, sessionId);
        if (forwarded) return;

        const userId = (req as any).user.sub;
        const result = await import('./ai.service.js').then(m => m.deleteSession(userId, sessionId));
        return res.status(200).json(result);
    } catch (error: any) {
        logger.error('Error en deleteSessionCtrl:', error);
        if (error.message === 'Sesión no encontrada' || error.message === 'No tienes permiso para eliminar esta sesión') {
            return res.status(403).json({ message: error.message });
        }
        return res.status(500).json({ message: 'Error al eliminar la sesión' });
    }
}
