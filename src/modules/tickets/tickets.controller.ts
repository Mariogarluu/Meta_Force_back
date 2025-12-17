import type { Request, Response } from 'express';
import {
  createTicket,
  listTickets,
  getTicketById,
  updateTicket,
  deleteTicket
} from './tickets.service.js';
import { CloudinaryService } from '../../services/cloudinary.service.js';

/**
 * Controlador para crear un nuevo ticket de contacto (público, sin autenticación)
 */
export async function createTicketCtrl(req: Request, res: Response) {
  try {
    // Primero crear el ticket sin archivos
    const ticket = await createTicket({
      ...req.body,
      attachments: [] // Inicialmente sin archivos
    });

    // Si hay archivos, subirlos y actualizar el ticket
    const attachmentUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        if (file.buffer) {
          try {
            const url = await CloudinaryService.uploadTicketAttachment(
              file.buffer,
              file.originalname,
              ticket.id
            );
            attachmentUrls.push(url);
          } catch (fileError: any) {
            console.error(`Error subiendo archivo ${file.originalname}:`, fileError);
            // Continuar con los demás archivos aunque uno falle
          }
        }
      }

      // Actualizar el ticket con las URLs de los archivos
      if (attachmentUrls.length > 0) {
        // Actualizar attachments manualmente
        const { prisma } = await import('../../config/db.js');
        const updatedTicket = await prisma.ticket.update({
          where: { id: ticket.id },
          data: { attachments: attachmentUrls },
          include: {
            center: {
              select: { id: true, name: true, city: true, country: true }
            }
          }
        });
        return res.status(201).json(updatedTicket);
      }
    }

    res.status(201).json(ticket);
  } catch (error: any) {
    if (error.code === 'P2003') {
      return res.status(404).json({ message: 'Centro no encontrado' });
    }
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para listar tickets (requiere autenticación)
 */
export async function listTicketsCtrl(req: Request, res: Response) {
  try {
    const user = req.user!;
    const tickets = await listTickets(user.role, user.centerId || null);
    res.json(tickets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para obtener un ticket por ID
 */
export async function getTicketCtrl(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'ID de ticket requerido' });
    }
    const user = req.user!;
    const ticket = await getTicketById(id, user.role, user.centerId || null);
    res.json(ticket);
  } catch (error: any) {
    if (error.message === 'Ticket no encontrado' || error.message.includes('permiso')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para actualizar un ticket
 */
export async function updateTicketCtrl(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'ID de ticket requerido' });
    }
    const user = req.user!;
    const ticket = await updateTicket(id, req.body, user.role, user.centerId || null);
    res.json(ticket);
  } catch (error: any) {
    if (error.message === 'Ticket no encontrado' || error.message.includes('permiso')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para eliminar un ticket
 */
export async function deleteTicketCtrl(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'ID de ticket requerido' });
    }
    const user = req.user!;
    await deleteTicket(id, user.role, user.centerId || null);
    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'Ticket no encontrado' || error.message.includes('permiso')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
}

