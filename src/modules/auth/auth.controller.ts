import type { Request, Response } from 'express';
import { logger } from '../../utils/logger.js';
import { register, login } from './auth.service.js';
import { registerSchema, loginSchema } from '../users/users.schema.js';

const COOKIE_NAME = 'auth_token';

const setCookie = (res: Response, token: string) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
  });
};

export async function registerCtrl(req: Request, res: Response) {
  try {
    const { email, name, password, role } = registerSchema.parse(req.body);
    const data = await register(email.trim(), name.trim(), password.trim(), role as any);

    // Set Secure Cookie
    setCookie(res, data.token);

    return res.status(201).json(data);
  } catch (e: any) {
    logger.error(`Error en Registro: ${e.message}`);
    if (e.message === 'Email ya registrado') {
      return res.status(409).json({ message: e.message });
    }
    return res.status(400).json({ message: e.message });
  }
}

export async function loginCtrl(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const data = await login(email.trim(), password.trim());

    // Set Secure Cookie
    setCookie(res, data.token);

    return res.json(data);
  } catch (e: any) {
    logger.error(`Error en Login: ${e.message}`);
    if (e.message === 'Credenciales inválidas' || e.message.includes('Cuenta no validada')) {
      return res.status(401).json({ message: e.message });
    }
    return res.status(400).json({ message: e.message });
  }
}