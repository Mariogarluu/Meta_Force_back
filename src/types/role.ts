/**
 * Enum de roles del sistema
 * Este tipo debe coincidir con el enum Role definido en Prisma schema
 */
export enum Role {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN_CENTER = 'ADMIN_CENTER',
  TRAINER = 'TRAINER',
  CLEANER = 'CLEANER',
  USER = 'USER'
}

