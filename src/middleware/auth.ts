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

const COOKIE_NAME = 'auth_token';

/**
 * Middleware de autenticación JWT que verifica el token desde:
 * 1. Header Authorization: Bearer <token>
 * 2. Cookie auth_token (HttpOnly, enviada con withCredentials)
 * Valida el payload y añade req.user. Retorna 401 si falta o es inválido.
 */
export function auth(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined;
  const header = req.headers.authorization;
  
  if (header?.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  } else if (req.cookies?.[COOKIE_NAME]) {
    token = req.cookies[COOKIE_NAME] as string;
  }
  
  if (!token) {
    return res.status(401).json({ message: 'No autorizado' });
  }
  
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

