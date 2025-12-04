import type { Request, Response } from 'express';
import { 
  getUserNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead 
} from './notifications.service.js';

export async function listNotificationsCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    
    // Aseguramos que sub existe con !
    const notifications = await getUserNotifications(req.user!.sub);
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getUnreadCountCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    
    const count = await getUnreadCount(req.user!.sub);
    res.json({ count });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function markReadCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    
    const { id } = req.params;

    // VALIDACIÓN CRÍTICA: Aseguramos que 'id' existe y es un string
    if (!id) {
      return res.status(400).json({ message: 'ID de notificación requerido' });
    }

    await markAsRead(id, req.user!.sub);
    
    res.json({ success: true });
  } catch (error: any) {
    if (error.message && error.message.includes('no encontrada')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'Error interno' });
  }
}

export async function markAllReadCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    
    await markAllAsRead(req.user!.sub);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}