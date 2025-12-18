import { prisma } from '../../config/db.js';
import type { Prisma } from '@prisma/client';
import type { Prisma } from '@prisma/client';
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
  
  const centerName = center?.name || 'Centro desconocido';

  // 1. Notificar a los Admins del Centro
  await notifyCenterAdmins(centerId, title, message, link, type);

  // 2. Notificar a los Superadmins
  await notifySuperAdmins(title, `[Centro: ${centerName}] ${message}`, link, type);
}
// --------------------------------------------------

// ========== MACHINE TYPE (Modelos de máquinas) ==========

/**
 * Crea un nuevo tipo/modelo de máquina
 */
export async function createMachineType(data: {
  name: string;
  type: string;
}) {
  return prisma.machineType.create({ data });
}

/**
 * Lista todos los tipos de máquinas con información de instancias en centros
 */
export async function listMachineTypes(centerId?: string | null) {
  // CORRECCIÓN CRÍTICA: Usar {} en lugar de undefined para exactOptionalPropertyTypes
  const whereClause: Prisma.MachineTypeWhereInput = centerId 
    ? { machines: { some: { centerId } } } 
    : {};

  const includeClause: Prisma.MachineTypeInclude = {
    _count: {
      select: { machines: true }
    },
    machines: centerId
      ? {
          where: { centerId },
          include: {
            center: { select: { id: true, name: true } }
          }
        }
      : {
          include: {
            center: { select: { id: true, name: true } }
          }
        }
  };

  return prisma.machineType.findMany({
    where: whereClause,
    include: includeClause,
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Obtiene un tipo de máquina por su ID
 */
export async function getMachineTypeById(id: string) {
  return prisma.machineType.findUnique({
    where: { id },
    include: {
      machines: {
        include: {
          center: { select: { id: true, name: true, city: true } }
        },
        orderBy: [{ centerId: 'asc' }, { instanceNumber: 'asc' }]
      }
    }
  });
}

/**
 * Actualiza un tipo de máquina
 */
export async function updateMachineType(id: string, data: {
  name?: string;
  type?: string;
}) {
  return prisma.machineType.update({
    where: { id },
    data
  });
}

/**
 * Elimina un tipo de máquina (esto eliminará todas sus instancias)
 */
export async function deleteMachineType(id: string) {
  return prisma.machineType.delete({
    where: { id }
  });
}

// ========== MACHINE INSTANCES (Instancias de máquinas en centros) ==========

/**
 * Agrega instancias de un tipo de máquina a un centro
 * Crea múltiples instancias numeradas (ej: "Cinta 1", "Cinta 2", etc.)
 */
export async function addMachineToCenter(
  machineTypeId: string,
  data: {
    centerId: string;
    quantity: number;
    status?: string;
  }
) {
  // Verificar que el tipo de máquina existe
  const machineType = await prisma.machineType.findUnique({
    where: { id: machineTypeId }
  });
  if (!machineType) {
    throw new Error('Tipo de máquina no encontrado');
  }

  // Verificar que el centro existe
  const center = await prisma.center.findUnique({
    where: { id: data.centerId }
  });
  if (!center) {
    throw new Error('Centro no encontrado');
  }

  // OPTIMIZACIÓN DE RENDIMIENTO: Usar aggregate en lugar de findMany + sort
  const aggregate = await prisma.machine.aggregate({
    where: {
      machineTypeId,
      centerId: data.centerId
    },
    _max: { instanceNumber: true }
  });

  const currentMax = aggregate._max.instanceNumber ?? 0;
  const startNumber = currentMax + 1;

  // Crear las instancias
  const machines = [];
  const defaultStatus = data.status || 'operativa';

  for (let i = 0; i < data.quantity; i++) {
    const instanceNumber = startNumber + i;
    const machine = await prisma.machine.create({
      data: {
        machineTypeId,
        centerId: data.centerId,
        instanceNumber,
        status: defaultStatus
      },
      include: {
        machineType: true,
        center: { select: { id: true, name: true } }
      }
    });
    machines.push(machine);

    // Notificar cada creación
    try {
      await notifyMachineEvent(
        data.centerId,
        'Nueva Máquina Añadida 🆕',
        `Se ha añadido la máquina "${machineType.name} ${instanceNumber}" en estado "${defaultStatus}".`,
        machine.id,
        'SUCCESS'
      );
    } catch (error) {
      console.error('Error notificando creación de máquina:', error);
    }
  }

  return machines;
}

/**
 * Actualiza una instancia de máquina específica
 */
export async function updateMachineInCenter(
  machineTypeId: string,
  centerId: string,
  instanceNumber: number,
  data: {
    status?: string;
  }
) {
  const machine = await prisma.machine.findFirst({
    where: {
      machineTypeId,
      centerId,
      instanceNumber
    },
    include: {
      machineType: true
    }
  });

  if (!machine) {
    throw new Error('Instancia de máquina no encontrada');
  }

  const oldStatus = machine.status;
  const updatedMachine = await prisma.machine.update({
    where: { id: machine.id },
    data,
    include: {
      machineType: true,
      center: { select: { id: true, name: true } }
    }
  });

  // Notificar si cambió el estado
  if (data.status && data.status !== oldStatus) {
    try {
      let notificationType: NotificationType = 'INFO';
      if (data.status === 'en mantenimiento' || data.status === 'fuera de servicio') {
        notificationType = 'WARNING';
      } else if (oldStatus !== 'operativa' && data.status === 'operativa') {
        notificationType = 'SUCCESS';
      }

      // CORRECCIÓN DE SEGURIDAD: Uso de optional chaining por si acaso
      const machineName = updatedMachine.machineType?.name || 'Máquina';

      await notifyMachineEvent(
        centerId,
        'Máquina Actualizada 🛠️',
        `${machineName} ${instanceNumber}: Estado cambiado de "${oldStatus}" a "${data.status}".`,
        updatedMachine.id,
        notificationType
      );
    } catch (error) {
      console.error('Error notificando actualización de máquina:', error);
    }
  }

  return updatedMachine;
}

/**
 * Elimina una instancia de máquina de un centro
 */
export async function removeMachineFromCenter(
  machineTypeId: string,
  centerId: string,
  instanceNumber: number
) {
  const machine = await prisma.machine.findFirst({
    where: {
      machineTypeId,
      centerId,
      instanceNumber
    },
    include: {
      machineType: true
    }
  });

  if (!machine) {
    throw new Error('Instancia de máquina no encontrada');
  }

  await prisma.machine.delete({
    where: { id: machine.id }
  });

  // Notificar eliminación
  try {
    const machineName = machine.machineType?.name || 'Máquina desconocida';
    await notifyMachineEvent(
      centerId,
      'Máquina Eliminada 🗑️',
      `La máquina "${machineName} ${instanceNumber}" ha sido eliminada del inventario.`,
      undefined,
      'ERROR'
    );
  } catch (error) {
    console.error('Error notificando eliminación de máquina:', error);
  }

  return machine;
}

/**
 * Lista todas las máquinas (instancias)
 */
export async function listMachines(centerId?: string | null) {
  // CORRECCIÓN CRÍTICA: Usar {} en lugar de undefined para exactOptionalPropertyTypes
  const whereClause: Prisma.MachineWhereInput = centerId 
    ? { centerId } 
    : {};
  
  return prisma.machine.findMany({
    where: whereClause,
    include: {
      machineType: true,
      center: { select: { id: true, name: true, city: true } }
    },
    orderBy: [
      { centerId: 'asc' },
      { machineTypeId: 'asc' },
      { instanceNumber: 'asc' }
    ]
  });
}

/**
 * Obtiene una máquina por su ID
 */
export async function getMachineById(id: string) {
  return prisma.machine.findUnique({
    where: { id },
    include: {
      machineType: true,
      center: { select: { id: true, name: true, city: true, country: true } }
    }
  });
}

/**
 * Actualiza una máquina por su ID
 */
export async function updateMachine(id: string, data: {
  status?: string;
}) {
  const oldMachine = await prisma.machine.findUnique({
    where: { id },
    include: { machineType: true }
  });

  if (!oldMachine) {
    throw new Error('Máquina no encontrada');
  }

  const updatedMachine = await prisma.machine.update({
    where: { id },
    data,
    include: {
      machineType: true,
      center: { select: { id: true, name: true } }
    }
  });

  // Notificar si cambió el estado
  if (data.status && data.status !== oldMachine.status) {
    try {
      let notificationType: NotificationType = 'INFO';
      if (data.status === 'en mantenimiento' || data.status === 'fuera de servicio') {
        notificationType = 'WARNING';
      } else if (oldMachine.status !== 'operativa' && data.status === 'operativa') {
        notificationType = 'SUCCESS';
      }

      const machineName = updatedMachine.machineType?.name || 'Máquina';

      await notifyMachineEvent(
        oldMachine.centerId,
        'Máquina Actualizada 🛠️',
        `${machineName} ${updatedMachine.instanceNumber}: Estado cambiado de "${oldMachine.status}" a "${data.status}".`,
        updatedMachine.id,
        notificationType
      );
    } catch (error) {
      console.error('Error notificando actualización de máquina:', error);
    }
  }

  return updatedMachine;
}

/**
 * Elimina una máquina por su ID
 */
export async function deleteMachine(id: string) {
  const machineToDelete = await prisma.machine.findUnique({
    where: { id },
    include: { machineType: true }
  });

  if (!machineToDelete) {
    throw new Error('Máquina no encontrada para eliminar');
  }

  await prisma.machine.delete({
    where: { id }
  });

  // Notificar eliminación
  try {
    const machineName = machineToDelete.machineType?.name || 'Máquina desconocida';
    
    await notifyMachineEvent(
      machineToDelete.centerId,
      'Máquina Eliminada 🗑️',
      `La máquina "${machineName} ${machineToDelete.instanceNumber}" ha sido eliminada permanentemente del inventario.`,
      undefined,
      'ERROR'
    );
  } catch (error) {
    console.error('Error notificando eliminación de máquina:', error);
  }

  return machineToDelete;
}

/**
 * Lista máquinas por centro
 */
export async function listMachinesByCenter(centerId: string) {
  return prisma.machine.findMany({
    where: { centerId },
    include: {
      machineType: true
    },
    orderBy: [
      { machineTypeId: 'asc' },
      { instanceNumber: 'asc' }
    ]
  });
}