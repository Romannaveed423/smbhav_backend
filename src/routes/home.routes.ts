import { Router } from 'express';
import { getDashboard } from '../controllers/home.controller';
import { authenticate } from '../middleware/auth';
import { healthCheck } from '../controllers/health.controller';

const router = Router();

// Health check endpoint
router.get('/health', healthCheck('home'));

router.get('/dashboard', authenticate, getDashboard);

export default router;

