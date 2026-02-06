import { z } from 'zod';

/**
 * Reglas de contraseña segura:
 * - Mínimo 8 caracteres
 * - Al menos 1 mayúscula
 * - Al menos 1 minúscula
 * - Al menos 1 número
 * - Al menos 1 carácter especial
 */
const passwordComplexPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email({ message: "Formato de email inválido" }).trim().toLowerCase(),
    password: z.string().min(1, { message: "La contraseña es requerida" }),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(50, "El nombre es demasiado largo")
      .trim(),
    lastName: z.string()
      .min(2, "El apellido debe tener al menos 2 caracteres")
      .max(50, "El apellido es demasiado largo")
      .trim(),
    email: z.string()
      .email("Email inválido")
      .trim()
      .toLowerCase(),
    password: z.string()
      .regex(passwordComplexPattern, { 
        message: "La contraseña debe tener min 8 caracteres, mayúscula, minúscula, número y símbolo" 
      }),
    // Confirmación de password suele validarse en frontend, 
    // pero si la envías al back, añádela aquí.
  }),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RegisterInput = z.infer<typeof registerSchema>['body'];