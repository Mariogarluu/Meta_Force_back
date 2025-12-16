import { prisma } from '../../config/db.js';
import { notifyCenterAdmins } from '../notifications/notifications.service.js';
import type { NotificationType } from '../notifications/notifications.service.js';

export type TicketStatus = 'pending' | 'in_progress' | 'completed';

export interface CreateTicketInput {
  name: string;
  email: string;
  phone?: string;
  centerId: string;
  subject: string;
  description: string;
  attachments?: string[];
}

export interface UpdateTicketInput {
  status?: TicketStatus;
}

/**
 * Crea un nuevo ticket de contacto
 */
export async function createTicket(data: CreateTicketInput) {
  // Verificar que el centro existe
  const center = await prisma.center.findUnique({
    where: { id: data.centerId },
    select: { id: true, name: true }
  });

  if (!center) {
    throw new Error('Centro no encontrado');
  }

  const ticket = await prisma.ticket.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      centerId: data.centerId,
      subject: data.subject,
      description: data.description,
      attachments: data.attachments || [],
      status: 'pending'
    },
    include: {
      center: {
        select: { id: true, name: true }
      }
    }
  });

  // Notificar a los administradores del centro
  try {
    await notifyCenterAdmins(
      data.centerId,
      'Nuevo Ticket de Contacto 📧',
      `Se ha recibido un nuevo ticket de contacto de ${data.name} (${data.email}). Asunto: ${data.subject}`,
      `/tickets/${ticket.id}`,
      'INFO'
    );
  } catch (error) {
    console.error('Error notificando nuevo ticket:', error);
  }

  return ticket;
}

/**
 * Lista todos los tickets (filtrados por rol)
 */
export async function listTickets(userRole: string, userCenterId?: string | null) {
  const where: any = {};

  // Si es ADMIN_CENTER, solo mostrar tickets de su centro
  if (userRole === 'ADMIN_CENTER' && userCenterId) {
    where.centerId = userCenterId;
  }
  // SUPERADMIN ve todos los tickets

  return prisma.ticket.findMany({
    where,
    include: {
      center: {
        select: { id: true, name: true, city: true, country: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Obtiene un ticket por ID
 */
export async function getTicketById(id: string, userRole: string, userCenterId?: string | null) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      center: {
        select: { id: true, name: true, city: true, country: true }
      }
    }
  });

  if (!ticket) {
    throw new Error('Ticket no encontrado');
  }

  // Verificar permisos: ADMIN_CENTER solo puede ver tickets de su centro
  if (userRole === 'ADMIN_CENTER' && ticket.centerId !== userCenterId) {
    throw new Error('No tienes permiso para ver este ticket');
  }

  return ticket;
}

/**
 * Actualiza un ticket (cambiar estado, etc.)
 */
export async function updateTicket(id: string, data: UpdateTicketInput, userRole: string, userCenterId?: string | null) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      center: {
        select: { id: true, name: true }
      }
    }
  });

  if (!ticket) {
    throw new Error('Ticket no encontrado');
  }

  // Verificar permisos
  if (userRole === 'ADMIN_CENTER' && ticket.centerId !== userCenterId) {
    throw new Error('No tienes permiso para actualizar este ticket');
  }

  const updateData: any = {};
  if (data.status) {
    updateData.status = data.status;
    // Si se marca como completado, registrar la fecha
    if (data.status === 'completed') {
      updateData.completedAt = new Date();
    } else if (ticket.completedAt) {
      // Si se cambia de completado a otro estado (pending o in_progress), limpiar la fecha
      updateData.completedAt = null;
    }
  }

  return prisma.ticket.update({
    where: { id },
    data: updateData,
    include: {
      center: {
        select: { id: true, name: true, city: true, country: true }
      }
    }
  });
}

/**
 * Elimina un ticket
 */
export async function deleteTicket(id: string, userRole: string, userCenterId?: string | null) {
  const ticket = await prisma.ticket.findUnique({
    where: { id }
  });

  if (!ticket) {
    throw new Error('Ticket no encontrado');
  }

  // Verificar permisos
  if (userRole === 'ADMIN_CENTER' && ticket.centerId !== userCenterId) {
    throw new Error('No tienes permiso para eliminar este ticket');
  }

  // Eliminar archivos adjuntos de Cloudinary si existen
  // TODO: Implementar eliminación de archivos si es necesario

  await prisma.ticket.delete({
    where: { id }
  });

  return ticket;
}

