import { Request, Response } from 'express';
import {
  getBodyWeightsByUser,
  createBodyWeight,
  deleteBodyWeight,
  getExerciseRecordsByUser,
  createExerciseRecord,
  deleteExerciseRecord,
} from './performance.service.js';

export const listBodyWeightsCtrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const records = await getBodyWeightsByUser(userId);
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createBodyWeightCtrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const record = await createBodyWeight(userId, req.body);
    res.status(201).json(record);
  } catch (error: any) {
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
    const userId = (req as any).user.id;
    const records = await getExerciseRecordsByUser(userId);
    res.json(records);
  } catch (error: any) {
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
