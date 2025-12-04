import { prisma } from '../../config/db.js';
// 1. Importamos las funciones (Valores reales)
import { notifyCenterAdmins, notifySuperAdmins } from '../notifications/notifications.service.js';
// 2. Importamos el tipo por separado (Solo TypeScript)
import type { NotificationType } from '../notifications/notifications.service.js';

// --- HELPER INTERNO PARA NOTIFICACIONES DUALES ---
/**
 * Envía notificaciones tanto a los administradores del centro afectado como a los Superadministradores globales.
 * Busca el nombre del centro para mostrarlo de forma legible.
 */
async function notifyMachineEvent(
  centerId: string,
  title: string,
  message: string,
  machineId?: string,
  type: NotificationType = 'INFO'
) {
  const link = machineId ? `/machines?search=${machineId}` : '/machines';

  // Buscar el nombre del centro para que el mensaje sea legible
  const center = await prisma.center.findUnique({
    where: { id: centerId },
    select: { name: true }
  });
  
  const centerName = center ? center.name : 'Centro desconocido';

  // 1. Notificar a los Admins del Centro (ellos ya saben su centro, mensaje directo)
  await notifyCenterAdmins(centerId, title, message, link, type);

  // 2. Notificar a los Superadmins (añadimos el NOMBRE del centro al mensaje)
  // Cambio clave: Usamos centerName en lugar de centerId
  await notifySuperAdmins(title, `[Centro: ${centerName}] ${message}`, link, type);
}
// --------------------------------------------------


/**
 * Crea una nueva máquina de gimnasio y notifica el evento.
 */
export async function createMachine(data: {
  name: string;
  type: string;
  status: string;
  centerId: string;
}) {
  const machine = await prisma.machine.create({ data });

  try {
    await notifyMachineEvent(
      machine.centerId,
      'Nueva Máquina Añadida 🆕',
      `Se ha añadido la máquina "${machine.name}" (${machine.type}) en estado "${machine.status}".`,
      machine.id,
      'SUCCESS'
    );
  } catch (error) {
    console.error('Error notificando creación de máquina:', error);
  }

  return machine;
}

export async function listMachines() {
  return prisma.machine.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      center: { select: { id: true, name: true, city: true } },
    },
  });
}

export async function getMachineById(id: string) {
  return prisma.machine.findUnique({
    where: { id },
    include: {
      center: { select: { id: true, name: true, city: true, country: true } },
    },
  });
}

/**
 * Actualiza una máquina y genera notificaciones precisas sobre los cambios.
 */
export async function updateMachine(id: string, data: Partial<Parameters<typeof createMachine>[0]>) {
  // 1. Obtener estado original ANTES de actualizar
  const oldMachine = await prisma.machine.findUnique({ where: { id } });
  if (!oldMachine) throw new Error('Máquina no encontrada');

  // 2. Realizar la actualización
  const updatedMachine = await prisma.machine.update({ where: { id }, data });

  // 3. Calcular las diferencias (Deltas) para el mensaje
  const changes: string[] = [];
  if (data.name && data.name !== oldMachine.name) {
    changes.push(`Nombre cambiado de "${oldMachine.name}" a "${data.name}"`);
  }
  if (data.type && data.type !== oldMachine.type) {
    changes.push(`Tipo cambiado de "${oldMachine.type}" a "${data.type}"`);
  }
  if (data.status && data.status !== oldMachine.status) {
    changes.push(`Estado cambiado de "${oldMachine.status}" a "${data.status}"`);
  }
  
  // Lógica especial si se mueve de centro
  let targetCenterId = oldMachine.centerId;
  if (data.centerId && data.centerId !== oldMachine.centerId) {
    // Necesitamos el nombre del centro nuevo para el mensaje
    const newCenter = await prisma.center.findUnique({ where: { id: data.centerId }, select: { name: true } });
    const oldCenter = await prisma.center.findUnique({ where: { id: oldMachine.centerId }, select: { name: true } });
    
    const oldName = oldCenter?.name || 'Desconocido';
    const newName = newCenter?.name || 'Desconocido';

    changes.push(`Movida del Centro "${oldName}" al "${newName}"`);
    targetCenterId = data.centerId; // La notificación debe ir al nuevo centro
  }

  // 4. Si hubo cambios, notificar
  if (changes.length > 0) {
    const message = changes.join('. ') + '.';
    
    // Determinar severidad
    let type: NotificationType = 'INFO';
    if (data.status === 'en mantenimiento' || data.status === 'fuera de servicio') {
      type = 'WARNING';
    } else if (oldMachine.status !== 'operativa' && data.status === 'operativa') {
      type = 'SUCCESS';
    }

    try {
      await notifyMachineEvent(
        targetCenterId,
        'Máquina Actualizada 🛠️',
        `${updatedMachine.name}: ${message}`,
        updatedMachine.id,
        type
      );
    } catch (error) {
      console.error('Error notificando actualización de máquina:', error);
    }
  }

  return updatedMachine;
}

/**
 * Elimina una máquina y notifica el evento.
 */
export async function deleteMachine(id: string) {
  // 1. Obtener datos antes de borrar para la notificación
  const machineToDelete = await prisma.machine.findUnique({ where: { id } });
  if (!machineToDelete) throw new Error('Máquina no encontrada para eliminar');

  // 2. Borrar
  await prisma.machine.delete({ where: { id } });

  // 3. Notificar
  try {
    await notifyMachineEvent(
      machineToDelete.centerId,
      'Máquina Eliminada 🗑️',
      `La máquina "${machineToDelete.name}" (${machineToDelete.type}) ha sido eliminada permanentemente del inventario.`,
      undefined,
      'ERROR'
    );
  } catch (error) {
    console.error('Error notificando eliminación de máquina:', error);
  }

  return machineToDelete;
}

export async function listMachinesByCenter(centerId: string) {
  return prisma.machine.findMany({
    where: { centerId },
    orderBy: { createdAt: 'desc' },
  });
}