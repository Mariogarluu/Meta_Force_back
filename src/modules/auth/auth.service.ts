import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { createUser, findUserByEmail, getMeWithCenter } from '../users/users.service.js';
import { Role } from '../../types/role.js';
import { notifySuperAdmins } from '../notifications/notifications.service.js';

/**
 * =============================================================================
 * SERVICIO DE AUTENTICACIÓN (AUTH SERVICE)
 * =============================================================================
 * Gestiona el ciclo de vida de la sesión del usuario, incluyendo el alta
 * de nuevas cuentas, validación de credenciales y emisión de tokens JWT.
 */

/**
 * Registra un nuevo usuario en la plataforma.
 * 
 * FLUJO DE REGISTRO:
 * 1. Verifica si el email ya existe para evitar duplicados.
 * 2. Hashea la contraseña con Bcrypt para seguridad (reposo).
 * 3. Crea el registro del usuario con estado PENDING por defecto.
 * 4. Envía notificaciones a los SuperAdmins para validación manual.
 * 5. Genera un token JWT inicial para sesión inmediata.
 * 
 * @param email - Correo único del usuario.
 * @param name - Nombre completo.
 * @param password - Contraseña en texto plano (será hasheada).
 * @param role - Rol solicitado (opcional).
 * @returns Perfil del usuario y token de sesión.
 */
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

/**
 * Autentica a un usuario existente mediante sus credenciales.
 * 
 * FLUJO DE LOGIN:
 * 1. Busca al usuario por email.
 * 2. Verifica si la cuenta está en estado 'ACTIVE'. Si no, deniega el acceso.
 * 3. Compara la contraseña proporcionada con el hash almacenado mediante bcrypt.compare.
 * 4. Si la validación es exitosa, genera un JWT firmado.
 * 
 * @param email - Correo del usuario.
 * @param password - Contraseña en texto plano.
 * @returns Perfil del usuario y token JWT de acceso.
 * @throws Error si las credenciales son inválidas o la cuenta no está activa.
 */
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