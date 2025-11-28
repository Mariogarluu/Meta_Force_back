import type { Request, Response, NextFunction } from 'express';
import { Role } from '../types/role.js';

/**
 * Factory function que crea un middleware para verificar que el usuario autenticado
 * tenga uno de los roles permitidos para acceder a la ruta.
 * 
 * Este middleware debe usarse después del middleware de autenticación (auth)
 * ya que requiere que req.user esté definido.
 * 
 * @param allowedRoles - Lista de roles permitidos para acceder a la ruta
 * @returns Middleware de Express que verifica el rol del usuario
 * @example
 * router.get('/admin', auth, hasRole(Role.SUPERADMIN), adminController);
 * router.post('/centers', auth, hasRole(Role.SUPERADMIN, Role.ADMIN_CENTER), createCenter);
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

