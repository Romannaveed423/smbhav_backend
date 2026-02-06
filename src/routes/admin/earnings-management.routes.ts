import { Router } from 'express';
import {
  listEarnings,
  getEarning,
  approveEarning,
  rejectEarning,
  adjustEarningAmount,
} from '../../controllers/admin/earnings-management.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import {
  listEarningsSchema,
  getEarningSchema,
  approveEarningSchema,
  rejectEarningSchema,
  adjustEarningAmountSchema,
} from '../../validations/admin/earnings-management.validation';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Earnings management routes
router.get('/earnings', validate(listEarningsSchema), listEarnings);
router.get('/earnings/:earningId', validate(getEarningSchema), getEarning);
router.post('/earnings/:earningId/approve', validate(approveEarningSchema), approveEarning);
router.post('/earnings/:earningId/reject', validate(rejectEarningSchema), rejectEarning);
router.post('/earnings/:earningId/adjust', validate(adjustEarningAmountSchema), adjustEarningAmount);

export default router;

