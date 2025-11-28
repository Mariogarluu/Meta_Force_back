import { prisma } from '../../config/db.js';

/**
 * Valida que el QR no haya expirado (máximo 20 minutos desde su generación).
 * 
 * @param timestamp - Timestamp ISO del QR
 * @returns true si el QR es válido (menos de 20 minutos), false si expiró
 */
export function validateQRTimestamp(timestamp: string): boolean {
  const qrTime = new Date(timestamp).getTime();
  const now = Date.now();
  const twentyMinutes = 20 * 60 * 1000; // 20 minutos en milisegundos
  
  return (now - qrTime) < twentyMinutes;
}

/**
 * Registra la entrada de un usuario a un centro físico.
 * Asigna el centerId (centro actual) al usuario, indicando que está físicamente presente en ese centro.
 * Un usuario solo puede estar en un centro a la vez. Si intenta entrar a otro centro sin salir primero,
 * se lanza un error. Si ya está en el mismo centro, retorna el usuario sin cambios.
 * 
 * Esta función actualiza el campo centerId del usuario, que es diferente de favoriteCenterId.
 * El centerId representa la ubicación física actual, mientras que favoriteCenterId es la asignación permanente.
 * 
 * @param userId - ID único del usuario que entra al centro
 * @param centerId - ID del centro al que el usuario está entrando
 * @returns Usuario actualizado con el centerId asignado (sin incluir passwordHash)
 * @throws Error si el usuario no existe, si el centro no existe, o si el usuario ya está en otro centro
 */
export async function registerEntry(userId: string, centerId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, centerId: true, name: true, email: true }
  });

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  // Verificar que el centro existe
  const center = await prisma.center.findUnique({
    where: { id: centerId }
  });

  if (!center) {
    throw new Error('Centro no encontrado');
  }

  // Si el usuario ya está en otro centro, no permitir entrada
  if (user.centerId && user.centerId !== centerId) {
    throw new Error('El usuario ya está registrado en otro centro. Debe salir primero.');
  }

  // Si ya está en este centro, no hacer nada (entrada duplicada)
  if (user.centerId === centerId) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, status: true, centerId: true, createdAt: true }
    });
  }

  // Asignar el centro al usuario
  return prisma.user.update({
    where: { id: userId },
    data: { centerId },
    select: { id: true, email: true, name: true, role: true, status: true, centerId: true, createdAt: true }
  });
}

/**
 * Registra la salida de un usuario de un centro físico.
 * Elimina el centerId del usuario (lo establece en null), indicando que ya no está físicamente presente.
 * Valida que el usuario esté registrado en el centro especificado antes de permitir la salida.
 * 
 * Esta función solo afecta el campo centerId (centro actual), no modifica favoriteCenterId.
 * 
 * @param userId - ID único del usuario que sale del centro
 * @param centerId - ID del centro del que el usuario está saliendo (usado para validación)
 * @returns Usuario actualizado con centerId en null (sin incluir passwordHash)
 * @throws Error si el usuario no existe o si no está registrado en el centro especificado
 */
export async function registerExit(userId: string, centerId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, centerId: true }
  });

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  // Verificar que el usuario está en el centro correcto
  if (user.centerId !== centerId) {
    throw new Error('El usuario no está registrado en este centro');
  }

  // Eliminar el centerId (ponerlo en null)
  return prisma.user.update({
    where: { id: userId },
    data: { centerId: null },
    select: { id: true, email: true, name: true, role: true, status: true, centerId: true, createdAt: true }
  });
}

/**
 * Procesa un código QR escaneado y determina automáticamente si es una entrada o salida.
 * 
 * La lógica de detección es:
 * - Si el usuario NO tiene centerId o tiene un centerId diferente al escaneado → ENTRADA
 * - Si el usuario tiene el mismo centerId que el escaneado → SALIDA
 * 
 * Valida que el QR no haya expirado (máximo 20 minutos desde su generación) y que el usuario exista.
 * Ejecuta la operación correspondiente (registerEntry o registerExit) y retorna el resultado.
 * 
 * @param qrData - Objeto con los datos del QR parseados, debe contener al menos id (userId) y timestamp
 * @param centerId - ID del centro donde se está escaneando el QR
 * @returns Objeto con el tipo de operación ('entry' o 'exit') y el usuario actualizado
 * @throws Error si el QR expiró, si el usuario no existe, o si hay un error en el registro
 */
export async function processQRCode(qrData: { id: string; timestamp: string }, centerId: string) {
  // Validar que el QR no haya expirado
  if (!validateQRTimestamp(qrData.timestamp)) {
    throw new Error('El código QR ha expirado. Por favor, genera uno nuevo.');
  }

  const user = await prisma.user.findUnique({
    where: { id: qrData.id },
    select: { id: true, centerId: true, name: true, email: true, role: true, status: true }
  });

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  // Determinar si es entrada o salida
  const isEntry = user.centerId !== centerId || !user.centerId;
  const isExit = user.centerId === centerId;

  if (isEntry) {
    const updatedUser = await registerEntry(user.id, centerId);
    return { type: 'entry' as const, user: updatedUser };
  } else if (isExit) {
    const updatedUser = await registerExit(user.id, centerId);
    return { type: 'exit' as const, user: updatedUser };
  }

  throw new Error('No se pudo determinar el tipo de operación');
}

