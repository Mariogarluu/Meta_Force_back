import { Router } from 'express';
import { checkHealth } from './health.controller.js';

const router = Router();

// Ruta pública: GET /api/health
router.get('/', checkHealth);

export default router;