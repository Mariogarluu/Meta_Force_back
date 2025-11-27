import { z } from 'zod';
import { cuidSchema } from '../../utils/validation.js';

export const roleEnum = z.enum(['SUPERADMIN', 'ADMIN_CENTER', 'TRAINER', 'CLEANER', 'USER']);
export const userStatusEnum = z.enum(['PENDING', 'ACTIVE', 'INACTIVE']);

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  role: roleEnum.optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
});

export const updateUserSchema = {
  params: z.object({ id: cuidSchema }),
  body: z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
    email: z.string().email('Email inválido').optional(),
    role: roleEnum.optional(),
    status: userStatusEnum.optional(),
    centerId: cuidSchema.optional().nullable(),
  }),
};

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
});

export const userIdParamSchema = {
  params: z.object({ id: cuidSchema }),
};

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema.body>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

