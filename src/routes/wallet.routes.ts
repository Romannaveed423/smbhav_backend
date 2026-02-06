import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getBalance,
  getTransactions,
  getEarnings,
} from '../controllers/wallet.controller';

const router = Router();

router.use(authenticate);
router.get('/balance', getBalance);
router.get('/transactions', getTransactions);
router.get('/earnings', getEarnings);

export default router;

