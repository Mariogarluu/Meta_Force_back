import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { chatCtrl, getSessionsCtrl, savePlanCtrl, deleteSessionCtrl } from './ai.controller.js';

const router = Router();

router.use(auth);

router.post('/chat', chatCtrl);
router.post('/save-plan', savePlanCtrl);
router.get('/sessions', getSessionsCtrl);
router.delete('/sessions/:sessionId', deleteSessionCtrl);

export default router;
