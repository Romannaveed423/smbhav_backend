import { Router } from 'express';
import {
  getClickLogs,
  getClickLogById,
  getClickLogByClickId,
  getConversions,
  approveConversion,
  rejectConversion,
  adjustConversionAmount,
} from '../../controllers/admin/earnings.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import {
  getClickLogsSchema,
  getClickLogByIdSchema,
  getClickLogByClickIdSchema,
  getConversionsSchema,
  approveConversionSchema,
  rejectConversionSchema,
  adjustConversionAmountSchema,
} from '../../validations/admin/earnings.validation';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Click logs routes
router.get('/click-logs', validate(getClickLogsSchema), getClickLogs);
router.get('/click-logs/:clickLogId', validate(getClickLogByIdSchema), getClickLogById);
router.get('/click-logs/click/:clickId', validate(getClickLogByClickIdSchema), getClickLogByClickId);

// Conversions routes
router.get('/conversions', validate(getConversionsSchema), getConversions);
router.post('/conversions/:conversionId/approve', validate(approveConversionSchema), approveConversion);
router.post('/conversions/:conversionId/reject', validate(rejectConversionSchema), rejectConversion);
router.post('/conversions/:conversionId/adjust', validate(adjustConversionAmountSchema), adjustConversionAmount);

export default router;

