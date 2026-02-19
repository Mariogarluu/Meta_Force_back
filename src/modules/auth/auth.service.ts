import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { createUser, findUserByEmail, getMeWithCenter } from '../users/users.service.js';
import { Role } from '../../types/role.js';
import { notifySuperAdmins } from '../notifications/notifications.service.js';

export async function register(email: string, name: string, password: string, role?: Role) {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error('Email ya registrado');
  }

  const hash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
  const user = await createUser(email, name, hash, role);
  const userWithCenter = await getMeWithCenter(user.id);

  try {
    await notifySuperAdmins(
      'Nuevo Usuario Registrado 👤',
      `El usuario ${name} (${email}) se ha registrado y espera validación.`,
      '/users?status=PENDING',
      'INFO'
    );
  } catch (error) {
    console.error('Error enviando notificación de registro:', error);
  }

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      centerId: userWithCenter?.centerId || null,
      profileImageUrl: userWithCenter?.profileImageUrl || null
    },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    user: {
      ...user,
      centerId: userWithCenter?.centerId || null,
      profileImageUrl: userWithCenter?.profileImageUrl || null
    },
    token
  };
}

export async function login(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) {
    console.log(`Login fallido: El email ${email} no existe.`);
    throw new Error('Credenciales inválidas');
  }

  if (user.status !== 'ACTIVE') {
    console.log(`Login bloqueado: El usuario ${email} tiene estado ${user.status}.`);
    throw new Error('Cuenta no validada. Contacta con un administrador para activar tu cuenta.');
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    console.log(`Login fallido: Contraseña incorrecta para ${email}.`);
    throw new Error('Credenciales inválidas');
  }

  const userWithCenter = await getMeWithCenter(user.id);

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      centerId: userWithCenter?.centerId || null,
      profileImageUrl: userWithCenter?.profileImageUrl || null
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
      centerId: userWithCenter?.centerId || null,
      profileImageUrl: userWithCenter?.profileImageUrl || null
    },
    token
  };
}