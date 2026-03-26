import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createBodyWeightSchema,
  createExerciseRecordSchema,
  recordIdParamSchema
} from './performance.schema.js';
import {
  listBodyWeightsCtrl,
  createBodyWeightCtrl,
  deleteBodyWeightCtrl,
  listExerciseRecordsCtrl,
  createExerciseRecordCtrl,
  deleteExerciseRecordCtrl
} from './performance.controller.js';

const router = Router();

// Body Weight Records
router.get('/body-weight', auth, listBodyWeightsCtrl);
router.post('/body-weight', auth, validate(createBodyWeightSchema), createBodyWeightCtrl);
router.delete('/body-weight/:id', auth, validate(recordIdParamSchema), deleteBodyWeightCtrl);

// Exercise Records
router.get('/exercise-records', auth, listExerciseRecordsCtrl);
router.post('/exercise-records', auth, validate(createExerciseRecordSchema), createExerciseRecordCtrl);
router.delete('/exercise-records/:id', auth, validate(recordIdParamSchema), deleteExerciseRecordCtrl);

export default router;
