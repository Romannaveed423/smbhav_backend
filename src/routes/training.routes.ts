import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getTrainings,
  getTrainingById,
  markTrainingComplete,
} from '../controllers/training.controller';

const router = Router();

router.use(authenticate);
router.get('/', getTrainings);
router.get('/:id', getTrainingById);
router.post('/:id/complete', markTrainingComplete);

export default router;

