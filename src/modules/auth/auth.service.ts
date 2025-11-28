import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { createUser, findUserByEmail, getMeWithCenter } from '../users/users.service.js';
import { Role } from '../../types/role.js';

/**
 * Registra un nuevo usuario en el sistema.
 */
export async function register(email: string, name: string, password: string, role?: Role) {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error('Email ya registrado');
  }
  
  const hash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
  const user = await createUser(email, name, hash, role);
  const userWithCenter = await getMeWithCenter(user.id);
  
  const token = jwt.sign(
    { 
      sub: user.id, 
      email: user.email,
      role: user.role,
      centerId: userWithCenter?.centerId || null
    }, 
    env.JWT_SECRET, 
    { expiresIn: '7d' }
  );
  
  // CORRECCIÓN: Devolver centerId también en el registro
  return { 
    user: {
      ...user,
      centerId: userWithCenter?.centerId || null
    }, 
    token 
  };
}

/**
 * Autentica un usuario con su email y contraseña.
 */
export async function login(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('Credenciales inválidas');
  }

  if (user.status !== 'ACTIVE') {
    throw new Error('Cuenta no validada. Contacta con un administrador para activar tu cuenta.');
  }
  
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new Error('Credenciales inválidas');
  }
  
  // Obtenemos datos frescos del centro
  const userWithCenter = await getMeWithCenter(user.id);

  const token = jwt.sign(
    { 
      sub: user.id, 
      email: user.email,
      role: user.role,
      centerId: userWithCenter?.centerId || null
    }, 
    env.JWT_SECRET, 
    { expiresIn: '7d' }
  );

  // CORRECCIÓN CRÍTICA AQUÍ 👇
  // Antes no devolvíamos el centerId en el objeto user, por eso el frontend lo veía NULL
  return { 
    user: { 
      id: user.id, 
      email: user.email, 
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      centerId: userWithCenter?.centerId || null // <--- ESTO FALTABA
    }, 
    token 
  };
}