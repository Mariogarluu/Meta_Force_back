import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { 
  listNotificationsCtrl, 
  getUnreadCountCtrl, 
  markReadCtrl, 
  markAllReadCtrl 
} from './notifications.controller.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(auth);

router.get('/', listNotificationsCtrl);
router.get('/unread-count', getUnreadCountCtrl);
router.patch('/:id/read', markReadCtrl);
router.patch('/read-all', markAllReadCtrl);

export default router;