import { prisma } from '../../config/db.js';

/**
 * Crea un nuevo plan de membresía en el sistema.
 */
export async function createMembershipPlan(data: {
  name: string;
  description?: string;
  price: number;
  duration: number;
  features?: string[];
  isActive?: boolean;
}) {
  return prisma.membershipPlan.create({
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      duration: data.duration,
      features: data.features || [],
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });
}

/**
 * Lista todos los planes de membresía.
 * Si includeInactive es false, solo retorna los planes activos.
 */
export async function listMembershipPlans(includeInactive: boolean = false) {
  const where = includeInactive ? {} : { isActive: true };
  
  return prisma.membershipPlan.findMany({
    where,
    orderBy: [
      { isActive: 'desc' },
      { price: 'asc' },
      { createdAt: 'desc' },
    ],
  });
}

/**
 * Obtiene un plan de membresía específico por su ID.
 */
export async function getMembershipPlanById(id: string) {
  return prisma.membershipPlan.findUnique({ where: { id } });
}

/**
 * Actualiza un plan de membresía existente.
 */
export async function updateMembershipPlan(
  id: string,
  data: Partial<Parameters<typeof createMembershipPlan>[0]>
) {
  return prisma.membershipPlan.update({ where: { id }, data });
}

/**
 * Elimina un plan de membresía de la base de datos.
 */
export async function deleteMembershipPlan(id: string) {
  return prisma.membershipPlan.delete({ where: { id } });
}

