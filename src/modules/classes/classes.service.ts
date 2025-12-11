import { prisma } from '../../config/db.js';

/**
 * Crea una nueva clase de gimnasio en el sistema.
 * Solo requiere nombre y descripción opcional.
 * Los centros, entrenadores y horarios se agregan después.
 */
export async function createClass(data: { 
  name: string; 
  description?: string;
}) {
  return prisma.gymClass.create({
    data: {
      name: data.name,
      description: data.description || null,
    },
    include: {
      trainers: {
        include: {
          trainer: {
            select: {
              id: true,
              name: true,
              profileImageUrl: true
            }
          }
        }
      },
      schedules: {
        include: {
          center: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });
}

/**
 * Agrega un centro a una clase existente con sus entrenadores y horarios.
 * Valida que los entrenadores pertenezcan al centro especificado.
 */
export async function addCenterToClass(classId: string, data: {
  centerId: string;
  trainerIds: string[];
  schedules: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}) {
  // Verificar que la clase exista
  const gymClass = await prisma.gymClass.findUnique({ where: { id: classId } });
  if (!gymClass) {
    throw new Error('Clase no encontrada');
  }

  // Verificar que el centro exista
  const center = await prisma.center.findUnique({ where: { id: data.centerId } });
  if (!center) {
    throw new Error('Centro no encontrado');
  }

  // Verificar que los entrenadores existan, sean activos y pertenezcan al centro
  const trainers = await prisma.user.findMany({
    where: {
      id: { in: data.trainerIds },
      role: 'TRAINER',
      status: 'ACTIVE',
      favoriteCenterId: data.centerId // Los entrenadores deben tener este centro como favorito
    }
  });

  if (trainers.length !== data.trainerIds.length) {
    throw new Error('Uno o más entrenadores no son válidos, no están activos o no pertenecen a este centro');
  }

  // Verificar que no haya horarios duplicados (mismo día y hora)
  const existingSchedules = await prisma.classCenterSchedule.findMany({
    where: {
      classId,
      centerId: data.centerId
    }
  });

  for (const newSchedule of data.schedules) {
    const duplicate = existingSchedules.find(
      s => s.dayOfWeek === newSchedule.dayOfWeek && 
           s.startTime === newSchedule.startTime &&
           s.endTime === newSchedule.endTime
    );
    if (duplicate) {
      throw new Error(`Ya existe un horario para ${newSchedule.dayOfWeek} de ${newSchedule.startTime} a ${newSchedule.endTime}`);
    }
  }

  // Agregar entrenadores (solo si no están ya asignados)
  const existingTrainers = await prisma.classTrainer.findMany({
    where: {
      classId,
      trainerId: { in: data.trainerIds }
    }
  });

  const existingTrainerIds = existingTrainers.map(t => t.trainerId);
  const newTrainerIds = data.trainerIds.filter(id => !existingTrainerIds.includes(id));

  // Agregar horarios
  await prisma.classCenterSchedule.createMany({
    data: data.schedules.map(schedule => ({
      classId,
      centerId: data.centerId,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime
    }))
  });

  // Agregar entrenadores nuevos
  if (newTrainerIds.length > 0) {
    await prisma.classTrainer.createMany({
      data: newTrainerIds.map(trainerId => ({
        classId,
        trainerId
      }))
    });
  }

  // Retornar la clase actualizada
  return getClassById(classId);
}

/**
 * Elimina un centro de una clase, incluyendo todos sus horarios y entrenadores asociados a ese centro.
 */
export async function removeCenterFromClass(classId: string, centerId: string) {
  // Verificar que la clase exista
  const gymClass = await prisma.gymClass.findUnique({ where: { id: classId } });
  if (!gymClass) {
    throw new Error('Clase no encontrada');
  }

  // Verificar que el centro exista
  const center = await prisma.center.findUnique({ where: { id: centerId } });
  if (!center) {
    throw new Error('Centro no encontrado');
  }

  // Eliminar todos los horarios de este centro para esta clase
  await prisma.classCenterSchedule.deleteMany({
    where: {
      classId,
      centerId
    }
  });

  // Obtener los entrenadores que solo están asignados a este centro
  const schedulesForCenter = await prisma.classCenterSchedule.findMany({
    where: { classId }
  });
  
  const centersWithSchedules = new Set(schedulesForCenter.map(s => s.centerId));
  
  // Si este era el único centro, eliminar todos los entrenadores
  // Si hay otros centros, mantener los entrenadores que también están en otros centros
  if (centersWithSchedules.size === 0) {
    // Era el único centro, eliminar todos los entrenadores
    await prisma.classTrainer.deleteMany({
      where: { classId }
    });
  }

  // Retornar la clase actualizada
  return getClassById(classId);
}

/**
 * Actualiza los horarios y entrenadores de un centro específico en una clase.
 */
export async function updateCenterInClass(classId: string, centerId: string, data: {
  trainerIds?: string[];
  schedules?: Array<{
    id?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}) {
  // Verificar que la clase exista
  const gymClass = await prisma.gymClass.findUnique({ where: { id: classId } });
  if (!gymClass) {
    throw new Error('Clase no encontrada');
  }

  // Verificar que el centro exista
  const center = await prisma.center.findUnique({ where: { id: centerId } });
  if (!center) {
    throw new Error('Centro no encontrado');
  }

  // Actualizar entrenadores si se proporcionan
  if (data.trainerIds !== undefined) {
    if (data.trainerIds.length === 0) {
      throw new Error('Debe haber al menos un entrenador');
    }

    // Verificar que los entrenadores pertenezcan al centro
    const trainers = await prisma.user.findMany({
      where: {
        id: { in: data.trainerIds },
        role: 'TRAINER',
        status: 'ACTIVE',
        favoriteCenterId: centerId
      }
    });

    if (trainers.length !== data.trainerIds.length) {
      throw new Error('Uno o más entrenadores no son válidos o no pertenecen a este centro');
    }

    // Eliminar entrenadores que no están en la nueva lista
    await prisma.classTrainer.deleteMany({
      where: {
        classId,
        trainerId: { notIn: data.trainerIds }
      }
    });

    // Agregar nuevos entrenadores
    const existingTrainers = await prisma.classTrainer.findMany({
      where: {
        classId,
        trainerId: { in: data.trainerIds }
      }
    });

    const existingTrainerIds = existingTrainers.map(t => t.trainerId);
    const newTrainerIds = data.trainerIds.filter(id => !existingTrainerIds.includes(id));

    if (newTrainerIds.length > 0) {
      await prisma.classTrainer.createMany({
        data: newTrainerIds.map(trainerId => ({
          classId,
          trainerId
        }))
      });
    }
  }

  // Actualizar horarios si se proporcionan
  if (data.schedules !== undefined) {
    // Eliminar horarios existentes de este centro que no estén en la nueva lista
    const scheduleIdsToKeep = data.schedules
      .filter(s => s.id)
      .map(s => s.id!);
    
    await prisma.classCenterSchedule.deleteMany({
      where: {
        classId,
        centerId,
        id: { notIn: scheduleIdsToKeep }
      }
    });

    // Crear o actualizar horarios
    for (const schedule of data.schedules) {
      if (schedule.id) {
        // Actualizar horario existente
        await prisma.classCenterSchedule.update({
          where: { id: schedule.id },
          data: {
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime
          }
        });
      } else {
        // Crear nuevo horario
        await prisma.classCenterSchedule.create({
          data: {
            classId,
            centerId,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime
          }
        });
      }
    }
  }

  // Retornar la clase actualizada
  return getClassById(classId);
}

/**
 * Lista todas las clases de gimnasio disponibles ordenadas por fecha de creación descendente.
 * Incluye entrenadores, horarios y centros.
 * Si se proporciona centerId, filtra las clases que tienen horarios en ese centro.
 */
export async function listClasses(centerId?: string | null) {
  const where = centerId ? {
    schedules: {
      some: {
        centerId
      }
    }
  } : {};

  const classes = await prisma.gymClass.findMany({
    where,
    include: {
      trainers: {
        include: {
          trainer: {
            select: {
              id: true,
              name: true,
              profileImageUrl: true
            }
          }
        }
      },
      schedules: {
        include: {
          center: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  // Transformar para incluir centros únicos
  return classes.map(cls => ({
    ...cls,
    centers: [...new Map(
      cls.schedules.map(s => [s.center.id, s.center])
    ).values()]
  }));
}

/**
 * Obtiene una clase de gimnasio completa por su ID.
 * Incluye entrenadores, horarios y centros.
 */
export async function getClassById(id: string) {
  const cls = await prisma.gymClass.findUnique({
    where: { id },
    include: {
      trainers: {
        include: {
          trainer: {
            select: {
              id: true,
              name: true,
              profileImageUrl: true
            }
          }
        }
      },
      schedules: {
        include: {
          center: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      }
    }
  });

  if (!cls) return null;

  return {
    ...cls,
    centers: [...new Map(
      cls.schedules.map(s => [s.center.id, s.center])
    ).values()]
  };
}

/**
 * Actualiza los datos de una clase de gimnasio existente.
 * Permite modificar nombre, descripción, entrenadores y horarios.
 */
export async function updateClass(id: string, data: { 
  name?: string; 
  description?: string;
  trainerIds?: string[];
  schedules?: Array<{
    id?: string;
    centerId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}) {
  // Si se proporcionan trainerIds, validar y actualizar
  if (data.trainerIds !== undefined) {
    if (data.trainerIds.length === 0) {
      throw new Error('La clase debe tener al menos un entrenador');
    }

    const trainers = await prisma.user.findMany({
      where: {
        id: { in: data.trainerIds },
        role: 'TRAINER',
        status: 'ACTIVE'
      }
    });

    if (trainers.length !== data.trainerIds.length) {
      throw new Error('Uno o más entrenadores no son válidos o no están activos');
    }

    // Eliminar todos los entrenadores actuales y crear los nuevos
    await prisma.classTrainer.deleteMany({
      where: { classId: id }
    });
  }

  // Si se proporcionan schedules, actualizar
  if (data.schedules !== undefined) {
    // Eliminar horarios existentes que no estén en la nueva lista
    const scheduleIdsToKeep = data.schedules
      .filter(s => s.id)
      .map(s => s.id!);
    
    await prisma.classCenterSchedule.deleteMany({
      where: {
        classId: id,
        id: { notIn: scheduleIdsToKeep }
      }
    });

    // Crear o actualizar horarios
    for (const schedule of data.schedules) {
      if (schedule.id) {
        // Actualizar horario existente
        await prisma.classCenterSchedule.update({
          where: { id: schedule.id },
          data: {
            centerId: schedule.centerId,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime
          }
        });
      } else {
        // Crear nuevo horario
        await prisma.classCenterSchedule.create({
          data: {
            classId: id,
            centerId: schedule.centerId,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime
          }
        });
      }
    }
  }

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.trainerIds && data.trainerIds.length > 0) {
    updateData.trainers = {
      create: data.trainerIds.map(trainerId => ({
        trainerId
      }))
    };
  }

  return prisma.gymClass.update({
    where: { id },
    data: updateData,
    include: {
      trainers: {
        include: {
          trainer: {
            select: {
              id: true,
              name: true,
              profileImageUrl: true
            }
          }
        }
      },
      schedules: {
        include: {
          center: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      }
    }
  });
}

/**
 * Elimina una clase de gimnasio de la base de datos.
 * Esta operación desconectará automáticamente a todos los usuarios apuntados a la clase.
 */
export async function deleteClass(id: string) {
  return prisma.gymClass.delete({ where: { id } });
}

/**
 * Lista todos los usuarios que están apuntados a una clase específica.
 * Retorna información pública de cada usuario ordenados por fecha de creación.
 */
export async function listUsersInClass(classId: string) {
  return prisma.user.findMany({
    where: { classes: { some: { id: classId } } },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Apunta un usuario a una clase de gimnasio.
 * Crea una relación many-to-many entre el usuario y la clase.
 */
export async function joinClass(userId: string, classId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { classes: { connect: { id: classId } } },
    select: { id: true, email: true, name: true, role: true },
  });
}

/**
 * Desapunta un usuario de una clase de gimnasio.
 * Elimina la relación entre el usuario y la clase sin afectar a otros usuarios.
 */
export async function leaveClass(userId: string, classId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { classes: { disconnect: { id: classId } } },
    select: { id: true, email: true, name: true, role: true },
  });
}
