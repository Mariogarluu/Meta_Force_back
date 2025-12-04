import { prisma } from '../../config/db.js';
import { Role } from '../../types/role.js';

export type NotificationType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';

export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}) {
  return prisma.notification.create({
    data: {
      ...data,
      type: data.type || 'INFO'
    }
  });
}

export async function notifyCenterAdmins(centerId: string, title: string, message: string, link?: string, type: NotificationType = 'WARNING') {
  const admins = await prisma.user.findMany({
    where: { 
      role: Role.ADMIN_CENTER, 
      centerId: centerId 
    },
    select: { id: true }
  });

  if (admins.length === 0) return;

  await prisma.notification.createMany({
    data: admins.map(admin => ({
      userId: admin.id,
      title,
      message,
      type,
      link: link ?? null
    }))
  });
}

export async function notifySuperAdmins(title: string, message: string, link?: string, type: NotificationType = 'INFO') {
  const admins = await prisma.user.findMany({
    where: { role: Role.SUPERADMIN },
    select: { id: true }
  });

  if (admins.length === 0) return;

  await prisma.notification.createMany({
    data: admins.map(admin => ({
      userId: admin.id,
      title,
      message,
      type,
      link: link ?? null
    }))
  });
}

export async function getUserNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50 
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, read: false }
  });
}

export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId }
  });

  if (!notification || notification.userId !== userId) {
    throw new Error('Notificación no encontrada o no autorizada');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true }
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true }
  });
}