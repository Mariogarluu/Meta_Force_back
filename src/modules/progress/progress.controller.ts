import type { Request, Response } from 'express';
import * as progressService from './progress.service.js';

export async function logMeasurementCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const measurement = await progressService.logMeasurement(req.user.sub, req.body);
    res.status(201).json(measurement);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getMeasurementHistoryCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const history = await progressService.getMeasurementHistory(req.user.sub);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function logExercisePerformanceCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const log = await progressService.logExercisePerformance(req.user.sub, req.body);
    res.status(201).json(log);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getExerciseHistoryCtrl(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'No autorizado' });
    const exerciseId = req.params['exerciseId'] as string;
    const history = await progressService.getExerciseHistory(req.user.sub, exerciseId);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
