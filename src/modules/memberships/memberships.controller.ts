import type { Request, Response } from 'express';
import {
  createMembershipPlan,
  listMembershipPlans,
  getMembershipPlanById,
  updateMembershipPlan,
  deleteMembershipPlan,
} from './memberships.service.js';

/**
 * Controlador para crear un nuevo plan de membresía.
 * Solo SUPERADMIN puede crear planes (protegido por middleware hasRole).
 */
export async function createMembershipPlanCtrl(req: Request, res: Response) {
  try {
    const plan = await createMembershipPlan(req.body);
    res.status(201).json(plan);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para listar planes de membresía.
 * Todos los usuarios autenticados pueden ver los planes activos.
 * Solo SUPERADMIN puede ver planes inactivos.
 */
export async function listMembershipPlansCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const includeInactive = req.user.role === 'SUPERADMIN';
    const plans = await listMembershipPlans(includeInactive);
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para obtener un plan de membresía específico por su ID.
 * Todos los usuarios autenticados pueden ver los detalles de un plan.
 */
export async function getMembershipPlanCtrl(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const id = req.params.id as string;
    const plan = await getMembershipPlanById(id);
    
    if (!plan) {
      return res.status(404).json({ message: 'Plan de membresía no encontrado' });
    }
    
    res.json(plan);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para actualizar un plan de membresía existente.
 * Solo SUPERADMIN puede actualizar planes (protegido por middleware hasRole).
 */
export async function updateMembershipPlanCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const updated = await updateMembershipPlan(id, req.body);
    res.json(updated);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Plan de membresía no encontrado' });
    }
    res.status(500).json({ message: error.message });
  }
}

/**
 * Controlador para eliminar un plan de membresía.
 * Solo SUPERADMIN puede eliminar planes (protegido por middleware hasRole).
 */
export async function deleteMembershipPlanCtrl(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    await deleteMembershipPlan(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Plan de membresía no encontrado' });
    }
    res.status(500).json({ message: error.message });
  }
}

