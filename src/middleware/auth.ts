import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Role } from '../types/role.js';

declare global {
  namespace Express {
    interface Request {
      user?: { 
        sub: string; 
        email: string;
        role: Role;
        centerId?: string | null;
      };
    }
  }
}

/**
 * Middleware de autenticación JWT que verifica y valida el token Bearer en el header Authorization.
 * Extrae la información del usuario del token JWT y la añade a req.user para uso en los controladores.
 * Valida que el token contenga sub, email, role y centerId (opcional) en el payload.
 * Retorna 401 si el token es inválido, está mal formado o falta.
 */
export function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado' });
  }
  
  const token = header.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No autorizado' });
  }
  
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    
    if (
      typeof payload === 'object' && 
      payload !== null && 
      'sub' in payload && 
      'email' in payload &&
      'role' in payload &&
      typeof payload.sub === 'string' &&
      typeof payload.email === 'string' &&
      typeof payload.role === 'string' &&
      Object.values(Role).includes(payload.role as Role)
    ) {
      req.user = { 
        sub: payload.sub, 
        email: payload.email,
        role: payload.role as Role,
        centerId: ('centerId' in payload && payload.centerId) ? payload.centerId as string : null
      };
      next();
    } else {
      return res.status(401).json({ message: 'Token inválido' });
    }
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}

