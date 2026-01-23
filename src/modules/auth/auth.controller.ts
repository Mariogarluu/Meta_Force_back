import type { Request, Response } from 'express';
import { register, login } from './auth.service.js';
import { registerSchema, loginSchema } from '../users/users.schema.js';

export async function registerCtrl(req: Request, res: Response) {
  try {
    const { email, name, password, role } = registerSchema.parse(req.body);
    // Limpiamos los datos antes de enviar al servicio
    const data = await register(email.trim(), name.trim(), password.trim(), role as any);
    return res.status(201).json(data);
  } catch (e: any) {
    console.error('🔥 Error en Registro:', e.message);
    if (e.message === 'Email ya registrado') {
      return res.status(409).json({ message: e.message });
    }
    return res.status(400).json({ message: e.message });
  }
}

export async function loginCtrl(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    // IMPORTANTE: Limpiamos los datos para evitar caracteres como \n
    const data = await login(email.trim(), password.trim());
    return res.json(data);
  } catch (e: any) {
    console.error('🔥 Error en Login:', e.message);
    if (e.message === 'Credenciales inválidas' || e.message.includes('Cuenta no validada')) {
      return res.status(401).json({ message: e.message });
    }
    // Siempre devolvemos JSON para que Retrofit no de "unexpected end of stream"
    return res.status(400).json({ message: e.message });
  }
}