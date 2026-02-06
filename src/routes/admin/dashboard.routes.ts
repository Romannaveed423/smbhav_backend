import { Router } from 'express';
import {
  getDashboardSummary,
  getProductAnalytics,
} from '../../controllers/admin/dashboard.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import {
  getDashboardSummarySchema,
  getProductAnalyticsSchema,
} from '../../validations/admin/dashboard.validation';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Dashboard routes
router.get('/dashboard', validate(getDashboardSummarySchema), getDashboardSummary);
router.get('/products/:productId/analytics', validate(getProductAnalyticsSchema), getProductAnalytics);

export default router;

