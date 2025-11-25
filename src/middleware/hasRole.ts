import type { Request, Response, NextFunction } from 'express';
import { Role } from '../types/role.js';

/**
 * Middleware para verificar que el usuario autenticado tenga uno de los roles permitidos
 * @param roles Roles permitidos para acceder a la ruta
 */
export function hasRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
    }

    next();
  };
}

