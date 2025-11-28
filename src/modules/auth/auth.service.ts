import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { createUser, findUserByEmail, getMeWithCenter } from '../users/users.service.js';
import { Role } from '../../types/role.js';

/**
 * Registra un nuevo usuario en el sistema.
 * Valida que el email no esté ya registrado, hashea la contraseña con bcrypt,
 * crea el usuario con estado PENDING por defecto y genera un token JWT.
 * 
 * @param email - Email único del usuario
 * @param name - Nombre completo del usuario
 * @param password - Contraseña en texto plano (será hasheada)
 * @param role - Rol opcional del usuario (por defecto USER)
 * @returns Objeto con el usuario creado (incluyendo centerId) y token JWT
 * @throws Error si el email ya está registrado
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
 * Verifica que el usuario exista, que su cuenta esté activa (status ACTIVE),
 * compara la contraseña con el hash almacenado y genera un token JWT válido por 7 días.
 * 
 * @param email - Email del usuario
 * @param password - Contraseña en texto plano
 * @returns Objeto con información del usuario (incluyendo centerId) y token JWT
 * @throws Error si las credenciales son inválidas o la cuenta no está activa
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

  return { 
    user: { 
      id: user.id, 
      email: user.email, 
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      centerId: userWithCenter?.centerId || null
    }, 
    token 
  };
}