import type { Request, Response } from 'express';
import { register, login } from './auth.service.js';
import { registerSchema, loginSchema } from '../users/users.schema.js';

/**
 * Controlador para registrar un nuevo usuario en el sistema.
 * Valida los datos con Zod antes de procesar el registro.
 * Retorna el usuario creado y un token JWT con status 201.
 * Retorna status 409 si el email ya está registrado.
 */
export async function registerCtrl(req: Request, res: Response) {
  try {
    const { email, name, password, role } = registerSchema.parse(req.body);
    const data = await register(email, name, password, role as any);
    res.status(201).json(data);
  } catch (e: any) {
    if (e.message === 'Email ya registrado') {
      return res.status(409).json({ message: e.message });
    }
    res.status(400).json({ message: e.message });
  }
}

/**
 * Controlador para autenticar un usuario existente.
 * Valida las credenciales y genera un token JWT válido por 7 días.
 * Retorna el usuario y el token si las credenciales son correctas.
 * Retorna status 401 si las credenciales son inválidas.
 */
export async function loginCtrl(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const data = await login(email, password);
    res.json(data);
  } catch (e: any) {
    if (e.message === 'Credenciales inválidas') {
      return res.status(401).json({ message: e.message });
    }
    res.status(400).json({ message: e.message });
  }
}

