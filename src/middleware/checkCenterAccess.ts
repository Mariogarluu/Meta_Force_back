import type { Request, Response, NextFunction } from 'express';
import { Role } from '../types/role.js';
import { prisma } from '../config/db.js';

/**
 * Middleware para verificar que ADMIN_CENTER solo accede a recursos de su propio centro.
 * SUPERADMIN tiene acceso completo a todos los recursos sin restricciones.
 * Retorna 403 si el usuario no tiene un centro asignado o si no tiene permisos.
 */
export function checkCenterAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  if (req.user.role === Role.SUPERADMIN) {
    return next();
  }

  if (req.user.role === Role.ADMIN_CENTER) {
    if (!req.user.centerId) {
      return res.status(403).json({ message: 'No tienes un centro asignado' });
    }
    return next();
  }

  return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
}

/**
 * Middleware asíncrono que verifica que el centroId en los parámetros de ruta pertenece al usuario autenticado.
 * SUPERADMIN puede acceder a cualquier centro sin verificación.
 * ADMIN_CENTER solo puede acceder a recursos de su propio centro identificado por centerId.
 * Retorna 403 si el usuario intenta acceder a un centro que no le pertenece.
 */
export async function verifyCenterOwnership(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  if (req.user.role === Role.SUPERADMIN) {
    return next();
  }

  if (req.user.role === Role.ADMIN_CENTER) {
    const centerId = req.params.id || req.params.centerId;
    
    if (!centerId || centerId !== req.user.centerId) {
      return res.status(403).json({ message: 'No tienes acceso a este centro' });
    }
    
    return next();
  }

  return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
}

