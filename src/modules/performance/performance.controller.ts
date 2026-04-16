import { Request, Response } from 'express';
import {
  getBodyWeightsByUser,
  createBodyWeight,
  deleteBodyWeight,
  getExerciseRecordsByUser,
  createExerciseRecord,
  deleteExerciseRecord,
} from './performance.service.js';
import { logger } from '../../utils/logger.js';

/**
 * =============================================================================
 * CONTROLADORES DE RENDIMIENTO (PERFORMANCE CONTROLLERS)
 * =============================================================================
 * Se encargan de la orquestación de las peticiones HTTP relacionadas con
 * las métricas del usuario. Validan la identidad del usuario y manejan errores.
 */

/**
 * Controlador para listar el historial de peso del usuario autenticado.
 * @param req - Request con req.user inyectado por el middleware auth
 * @param res - Response para enviar el listado JSON
 */
export const listBodyWeightsCtrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    // El middleware de Auth ya debería garantizar que user existe, 
    // pero realizamos una validación extra de seguridad para el ID.
    if (!user?.id) {
      logger.error('Performance Controller: userId no encontrado en la petición');
      res.status(401).json({ error: 'Usuario no autenticado correctamente' });
      return;
    }
    
    const records = await getBodyWeightsByUser(user.id);
    res.json(records);
  } catch (error: any) {
    logger.error(`Performance Controller (listBodyWeights): ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: error.message });
  }
};

export const createBodyWeightCtrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user?.id) {
      logger.error('Performance Controller: userId no encontrado en la petición');
      res.status(401).json({ error: 'Usuario no autenticado correctamente' });
      return;
    }
    
    const record = await createBodyWeight(user.id, req.body);
    res.status(201).json(record);
  } catch (error: any) {
    logger.error(`Performance Controller (createBodyWeight): ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: error.message });
  }
};

export const deleteBodyWeightCtrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    await deleteBodyWeight(id as string, userId);
    res.status(204).send();
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};

export const listExerciseRecordsCtrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user?.id) {
      logger.error('Performance Controller: userId no encontrado en la petición');
      res.status(401).json({ error: 'Usuario no autenticado correctamente' });
      return;
    }
    
    const records = await getExerciseRecordsByUser(user.id);
    res.json(records);
  } catch (error: any) {
    logger.error(`Performance Controller (listExerciseRecords): ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: error.message });
  }
};

export const createExerciseRecordCtrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const record = await createExerciseRecord(userId, req.body);
    res.status(201).json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteExerciseRecordCtrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    await deleteExerciseRecord(id as string, userId);
    res.status(204).send();
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};
