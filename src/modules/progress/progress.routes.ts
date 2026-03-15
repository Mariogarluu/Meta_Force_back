import { Router } from 'express';
import * as progressCtrl from './progress.controller.js';
import { auth } from '../../middleware/auth.js';

const router = Router();

router.use(auth);

// Medidas físicas
router.post('/measurements', progressCtrl.logMeasurementCtrl);
router.get('/measurements', progressCtrl.getMeasurementHistoryCtrl);

// Rendimiento de ejercicios
router.post('/exercises', progressCtrl.logExercisePerformanceCtrl);
router.get('/exercises/:exerciseId', progressCtrl.getExerciseHistoryCtrl);

export default router;
