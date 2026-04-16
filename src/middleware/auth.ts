import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Role } from '../types/role.js';

declare global {
  namespace Express {
    interface Request {
      user?: { 
        id: string;
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
 * =============================================================================
 * MIDDLEWARE DE AUTENTICACIÓN (JWT)
 * =============================================================================
 * Este middleware intercepta las peticiones entrantes y valida la presencia
 * de un JSON Web Token (JWT) válido. Soporta extracción desde headers y cookies.
 * 
 * Estrategia de búsqueda del token:
 * 1. Header 'Authorization' con esquema 'Bearer'.
 * 2. Cookie HttpOnly denominada 'auth_token'.
 */
export function auth(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined;
  const header = req.headers.authorization;
  
  if (header?.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  } else if (req.cookies?.[COOKIE_NAME]) {
    token = req.cookies[COOKIE_NAME] as string;
  }
  
  // Si tras buscar en header y cookies no hay token, denegamos el acceso
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'No autorizado: Se requiere una sesión activa' 
    });
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
        id: payload.sub,
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

