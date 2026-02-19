import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { chatCtrl, getSessionsCtrl } from './ai.controller.js';

const router = Router();

router.use(auth);

router.post('/chat', chatCtrl);
router.get('/sessions', getSessionsCtrl);

export default router;
