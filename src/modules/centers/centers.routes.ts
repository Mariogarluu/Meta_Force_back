import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createCenterSchema, updateCenterSchema, centerIdParamSchema } from './centers.schema.js';
import {
  createCenterCtrl, listCentersCtrl, getCenterCtrl, updateCenterCtrl, deleteCenterCtrl, listCenterUsersCtrl,
} from './centers.controller.js';

const router = Router();

router.get('/', auth, listCentersCtrl);
router.post('/', auth, validate(createCenterSchema), createCenterCtrl);
router.get('/:id', auth, validate(centerIdParamSchema), getCenterCtrl);
router.patch('/:id', auth, validate(updateCenterSchema), updateCenterCtrl);
router.delete('/:id', auth, validate(centerIdParamSchema), deleteCenterCtrl);
router.get('/:id/users', auth, validate(centerIdParamSchema), listCenterUsersCtrl);

export default router; // 👈 importante
